import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/supabase/admin";
import { checkDeletionBilling } from "@/lib/account-deletion";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (body?.confirmation !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });
  }

  let releaseGuard: (() => Promise<void>) | undefined;
  let deletionSubmitted = false;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }

    const admin = await supabaseAdmin();
    const { data: deletionToken, error: guardError } = await admin.rpc("begin_account_deletion", { p_user_id: user.id });
    if (guardError) throw guardError;
    if (!deletionToken) {
      return NextResponse.json({ error: "A checkout or account deletion is already in progress. An open checkout must expire before deletion. If this remains blocked, contact support from Help." }, { status: 409 });
    }
    releaseGuard = async () => {
      const { error } = await admin.rpc("finish_account_deletion", { p_user_id: user.id, p_token: deletionToken });
      if (error) console.error("Account deletion guard release failed");
    };
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const { data: billingAccount, error: billingAccountError } = await admin
      .from("billing_accounts")
      .select("customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (billingAccountError) throw billingAccountError;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const billingError = await checkDeletionBilling(
      stripe, user.email, profile?.customer_id ?? null, billingAccount?.customer_id ?? null,
    );
    if (billingError) {
      return NextResponse.json({ error: billingError }, { status: 409 });
    }

    // Revoke refresh sessions before deletion. The existing foreign keys remove
    // the profile and its generated records atomically with the auth user.
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
    deletionSubmitted = true;
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return NextResponse.json(
      { error: "We couldn't delete your account. Please sign in and try again, or email hi@basecase.vc." },
      { status: 500 },
    );
  } finally {
    // Once submitted, even a timeout may mean Auth is still deleting. Never
    // reopen checkout in that uncertain window. Success cascades the guard away.
    if (!deletionSubmitted) await releaseGuard?.().catch(() => console.error("Account deletion guard release failed"));
  }
}

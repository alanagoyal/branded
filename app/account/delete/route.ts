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

  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }

    const admin = await supabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const billingError = await checkDeletionBilling(
      stripe, user.email, profile?.customer_id ?? null,
    );
    if (billingError) {
      return NextResponse.json({ error: billingError }, { status: 409 });
    }

    // Revoke refresh sessions before deletion. The existing foreign keys remove
    // the profile and its generated records atomically with the auth user.
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return NextResponse.json(
      { error: "We couldn't delete your account. Please sign in and try again, or email hi@basecase.vc." },
      { status: 500 },
    );
  }
}

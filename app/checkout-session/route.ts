import { baseUrl } from "@/lib/plans";
import { supabaseAdmin } from "@/supabase/admin";
import { billingAccount, billingFailure, billingPrices, billingUser, BillingError, stripeClient, requireBillingOrigin } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    requireBillingOrigin(request);
    const user = await billingUser();
    if (!user.email || !user.email_confirmed_at) throw new BillingError("Please verify your email before subscribing.", 403);
    const body = await request.json().catch(() => null);
    if (body?.plan !== "pro" && body?.plan !== "business") throw new BillingError("Invalid plan.", 400);
    const price = billingPrices()[body.plan as "pro" | "business"];
    if (!price) throw new BillingError("Checkout is not configured. Please create a GitHub issue from Help.", 503);
    const stripe = stripeClient();
    const admin = await supabaseAdmin();
    let account = await billingAccount(user.id);
    if (!account) {
      const { data: profile, error } = await admin.from("profiles").select("customer_id").eq("id", user.id).single();
      if (error) throw error;
      // Historical profile links are only a signal to seek support, never proof
      // of ownership. Do not risk starting a second subscription for a legacy user.
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      if (profile.customer_id || existing.data.length) {
        throw new BillingError("Please create a GitHub issue from Help to verify your existing billing account before starting another subscription.");
      }
      const customer = await stripe.customers.create({ email: user.email, metadata: { branded_user_id: user.id } }, {
        idempotencyKey: `branded-customer-${user.id}`,
      });
      const { error: insertError } = await admin.from("billing_accounts").insert({ user_id: user.id, customer_id: customer.id });
      if (insertError && insertError.code !== "23505") throw insertError;
      account = await billingAccount(user.id);
      if (!account) throw new Error("Billing mapping was not saved");
    }
    // Repair a missing mirror after an earlier partial checkout attempt. The
    // canonical mapping remains authoritative even if this compatibility write fails.
    const { error: profileError } = await admin.from("profiles").update({ customer_id: account.customer_id }).eq("id", user.id);
    if (profileError) throw profileError;
    for await (const subscription of stripe.subscriptions.list({ customer: account.customer_id, status: "all", limit: 100 })) {
      if (!["canceled", "incomplete_expired"].includes(subscription.status)) {
        throw new BillingError("You already have a subscription. Use Manage billing to change it.");
      }
    }
    const { data: reservationData, error: reservationError } = await admin.rpc("reserve_billing_checkout", {
      p_user_id: user.id, p_plan: body.plan,
    });
    if (reservationError) throw reservationError;
    const reservation = reservationData as { token: string; plan: string; expires_at: number };
    if (reservation.plan !== body.plan) {
      throw new BillingError("A checkout for another plan is already open. Complete that checkout or try again after it expires (within 35 minutes).");
    }
    const session = await stripe.checkout.sessions.create({
      expires_at: reservation.expires_at,
      mode: "subscription", customer: account.customer_id, client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      subscription_data: { metadata: { branded_user_id: user.id } },
      success_url: `${baseUrl}/new?checkout_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
    }, { idempotencyKey: `branded-checkout-${reservation.token}` });
    return Response.json({ url: session.url });
  } catch (error) { return billingFailure(error); }
}

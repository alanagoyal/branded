import "server-only";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/supabase/admin";
import { billingSnapshot } from "@/lib/billing-state";

export class BillingError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}
export const stripeClient = () => new Stripe(process.env.STRIPE_SECRET_KEY!);
export const billingPrices = () => ({ pro: process.env.STRIPE_PRO_PRICE_ID, business: process.env.STRIPE_BUSINESS_PRICE_ID });

export async function billingUser() {
  const { data: { user }, error } = await (await createClient()).auth.getUser();
  if (error || !user) throw new BillingError("Please sign in again.", 401);
  return user;
}
export async function billingAccount(userId: string) {
  const admin = await supabaseAdmin();
  const { data, error } = await admin.from("billing_accounts").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function syncBilling(stripe: Stripe, customerId: string, eventId?: string) {
  const admin = await supabaseAdmin();
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: account, error } = await admin.from("billing_accounts").select("*").eq("customer_id", customerId).maybeSingle();
    if (error) throw error;
    // Legacy accounts are intentionally not inferred from an untrusted profile.
    if (!account) return null;
    if (eventId) {
      const { data: processed, error: lookupError } = await admin.from("billing_webhook_events").select("event_id").eq("event_id", eventId).maybeSingle();
      if (lookupError) throw lookupError;
      if (processed) return account;
    }
    const subscriptions: Stripe.Subscription[] = [];
    for await (const subscription of stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 })) {
      subscriptions.push(subscription);
    }
    const snapshot = billingSnapshot(subscriptions, billingPrices());
    const { data: applied, error: applyError } = await admin.rpc("apply_billing_snapshot", {
      p_customer_id: customerId, p_revision: account.revision, p_snapshot: snapshot, p_event_id: eventId ?? null,
    });
    if (applyError) throw applyError;
    if (applied) return { ...account, ...snapshot };
  }
  throw new Error("Concurrent billing updates; retry required");
}

export function billingFailure(error: unknown) {
  if (error instanceof BillingError) return Response.json({ error: error.message }, { status: error.status });
  console.error("Billing operation failed");
  return Response.json({ error: "Billing is unavailable. Please try again or create a GitHub issue from Help." }, { status: 503 });
}
export function requireBillingOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) throw new BillingError("Invalid request origin.", 403);
}

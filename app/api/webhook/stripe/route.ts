import type Stripe from "stripe";
import { stripeClient, syncBilling } from "@/lib/billing";

const handled = new Set([
  "checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed",
  "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted",
  "customer.subscription.paused", "customer.subscription.resumed",
  "invoice.paid", "invoice.payment_failed", "invoice.payment_action_required",
]);

export async function POST(request: Request) {
  if (!process.env.STRIPE_ENDPOINT_SECRET) return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  let stripe: Stripe;
  try { stripe = stripeClient(); }
  catch { return Response.json({ error: "Billing is unavailable." }, { status: 503 }); }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") ?? "", process.env.STRIPE_ENDPOINT_SECRET);
  } catch {
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  }
  if (!handled.has(event.type)) return Response.json({ received: true });
  try {
    const object = event.data.object as Stripe.Subscription | Stripe.Checkout.Session | Stripe.Invoice;
    const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id;
    if (!customerId) throw new Error("Missing customer");
    // Fetch current state, not the event's possibly stale snapshot. The database
    // CAS retries racing fetches and commits idempotency with the state update.
    const account = await syncBilling(stripe, customerId, event.id);
    if (!account) console.warn("Stripe event for unmapped customer; reconciliation required", event.id);
    return Response.json({ received: true });
  } catch {
    console.error("Stripe webhook processing failed", event.id);
    return Response.json({ error: "Webhook processing failed; retry required." }, { status: 500 });
  }
}

import { billingAccount, billingFailure, billingUser, BillingError, stripeClient, syncBilling, requireBillingOrigin } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    requireBillingOrigin(request);
    const user = await billingUser();
    const body = await request.json().catch(() => null);
    if (typeof body?.checkoutId !== "string" || !/^cs_[a-zA-Z0-9_]{1,250}$/.test(body.checkoutId)) {
      throw new BillingError("Invalid checkout session.", 400);
    }
    const account = await billingAccount(user.id);
    if (!account) throw new BillingError("Billing account not found.", 403);
    const stripe = stripeClient();
    const session = await stripe.checkout.sessions.retrieve(body.checkoutId);
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (customerId !== account.customer_id || session.client_reference_id !== user.id) {
      throw new BillingError("Checkout session does not belong to this account.", 403);
    }
    if (session.status !== "complete") throw new BillingError("Checkout is not complete.");
    await syncBilling(stripe, account.customer_id);
    return Response.json({ verified: true });
  } catch (error) { return billingFailure(error); }
}

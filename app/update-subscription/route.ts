import { billingAccount, billingFailure, billingUser, BillingError, stripeClient, syncBilling, requireBillingOrigin } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    requireBillingOrigin(request);
    const user = await billingUser();
    const account = await billingAccount(user.id);
    if (!account) throw new BillingError("Please email hi@basecase.vc to verify your existing billing account.");
    await syncBilling(stripeClient(), account.customer_id);
    return Response.json({ updated: true });
  } catch (error) { return billingFailure(error); }
}

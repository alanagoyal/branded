import { baseUrl } from "@/lib/plans";
import { billingAccount, billingFailure, billingUser, BillingError, stripeClient, requireBillingOrigin } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    requireBillingOrigin(request);
    const user = await billingUser();
    const account = await billingAccount(user.id);
    if (!account) throw new BillingError("Please create a GitHub issue from Help to verify your existing billing account.");
    const session = await stripeClient().billingPortal.sessions.create({
      customer: account.customer_id,
      return_url: `${baseUrl}/new?billing=refresh`,
    });
    return Response.json({ session: { url: session.url } });
  } catch (error) { return billingFailure(error); }
}

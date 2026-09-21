import type Stripe from "stripe";

// Historical profile billing IDs were user-editable; only billing_accounts is
// authoritative. Never use either identifier to mutate Stripe here.
// Check Stripe directly, including customers whose profile link was lost when
// the old webhook cleared customer_id on cancellation.
export async function checkDeletionBilling(
  stripe: Stripe,
  email: string,
  customerId: string | null,
  trustedCustomerId: string | null = null,
): Promise<string | null> {
  const customerIds = new Set<string>();
  if (trustedCustomerId) {
    const customer = await stripe.customers.retrieve(trustedCustomerId);
    // Ownership comes from the server-only mapping even if the auth or billing
    // email has since changed. Still inspect the actual subscription/schedule.
    if (!customer.deleted) customerIds.add(customer.id);
  }
  if (customerId && customerId !== trustedCustomerId) {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) {
      if (customer.email?.toLowerCase() !== email.toLowerCase()) {
        return "We couldn't verify your billing account. Please create a GitHub issue from Help before deleting your account.";
      }
      customerIds.add(customer.id);
    }
  }

  for await (const customer of stripe.customers.list({ email, limit: 100 })) {
    customerIds.add(customer.id);
  }

  for (const id of Array.from(customerIds)) {
    for await (const subscription of stripe.subscriptions.list({
      customer: id,
      status: "all",
      limit: 100,
    })) {
      if (
        subscription.status !== "canceled" &&
        subscription.status !== "incomplete_expired" &&
        !subscription.cancel_at_period_end &&
        !subscription.cancel_at
      ) {
        return "Please cancel your subscription using Manage billing before deleting your account, then try again.";
      }
    }
    // A future schedule can start billing even without a current subscription.
    for await (const schedule of stripe.subscriptionSchedules.list({
      customer: id,
      limit: 100,
    })) {
      if (schedule.status === "not_started" || schedule.status === "active") {
        return "Your billing account has a subscription schedule. Please create a GitHub issue from Help to cancel it before deleting your account.";
      }
    }
  }
  return null;
}

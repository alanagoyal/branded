import type Stripe from "stripe";

export type BillingSnapshot = {
  plan_id: string | null;
  plan_tier: "free" | "pro" | "business";
  subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export function billingSnapshot(
  subscriptions: Stripe.Subscription[],
  prices: { pro?: string; business?: string },
  now = Date.now(),
): BillingSnapshot {
  const tier = (subscription: Stripe.Subscription) => {
    const priceId = subscription.items.data[0]?.price.id;
    return priceId && priceId === prices.business ? "business" :
      priceId && priceId === prices.pro ? "pro" : "free";
  };
  const entitled = subscriptions.filter(subscription =>
    ["active", "trialing"].includes(subscription.status) &&
    subscription.current_period_end * 1000 > now && tier(subscription) !== "free",
  );
  // An old canceled subscription must not hide a newer active subscription.
  entitled.sort((a, b) => Number(tier(b) === "business") - Number(tier(a) === "business") || b.created - a.created);
  const subscription = entitled[0] ?? [...subscriptions].sort((a, b) => b.created - a.created)[0];
  const hasAccess = entitled.length > 0;
  const product = subscription?.items.data[0]?.price.product;
  return {
    plan_id: hasAccess && product ? (typeof product === "string" ? product : product.id) : null,
    plan_tier: hasAccess ? tier(subscription) : "free",
    subscription_id: subscription?.id ?? null,
    subscription_status: subscription?.status ?? null,
    current_period_end: subscription?.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: subscription?.cancel_at_period_end ?? false,
  };
}

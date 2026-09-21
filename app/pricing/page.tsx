import { billingAccount } from "@/lib/billing";
import Pricing from "@/components/pricing";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData, error } = await supabase
  .from("profiles")
  .select()
  .eq("id", user?.id)
  .single();

  const account = await billingAccount(user.id);
  // A Stripe customer can exist after an abandoned checkout without subscribing.
  const hasSubscription = account
    ? Boolean(account.subscription_status && !["canceled", "incomplete_expired"].includes(account.subscription_status))
    : Boolean(userData?.customer_id); // Unreconciled legacy account: support fallback.

  return (
    <div>
      <Pricing userData={userData} hasSubscription={hasSubscription} />
    </div>
  );
}

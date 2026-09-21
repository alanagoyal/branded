import { Checkout } from "@/components/checkout";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  if (plan !== "pro" && plan !== "business") redirect("/pricing");
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) redirect("/login");
  return <Checkout plan={plan} />;
}

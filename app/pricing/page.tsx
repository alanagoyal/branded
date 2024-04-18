import Pricing from "@/components/pricing";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function PricingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <Pricing />
    </div>
  );
}

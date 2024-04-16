"use client";

import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function VerifySubscription({ user }: { user: any }) {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const checkoutId = useMemo(
    () => searchParams.get("checkout_id"),
    [searchParams]
  );

  const [invoice, setInvoice] = useState(null);
  const [subscriptionId, setSubscriptionId] = useState("");
  const [planId, setPlanId] = useState("");

  useEffect(() => {
    fetchInvoice();
  }, [checkoutId]);

  async function fetchInvoice() {
    try {
      const response = await fetch(
        `/verify-subscription?checkout_id=${checkoutId}`
      );
      const data = await response.json();

      if (response.ok) {
        setInvoice(data.invoice);
        setSubscriptionId(data.subscriptionId);
        setPlanId(data.planId);

        if (user) {
          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_id: data.subscriptionId,
              plan_id: data.planId,
            })
            .eq("id", user.id);

          if (error) throw error;
        }
      } else {
        throw new Error("Failed to fetch invoice data");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    }
  }

  return null;
}

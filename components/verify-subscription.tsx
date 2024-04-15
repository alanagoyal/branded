"use client";

import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function VerifySubscription({user}: {user: any}) {
    const supabase = createClient();
  const searchParams = useSearchParams();
  const checkoutId = useMemo(
    () => searchParams.get("checkout_id"),
    [searchParams]
  );

  const [invoice, setInvoice] = useState(null);
  const [subscriptionItem, setSubscriptionItem] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const response = await fetch(
          `/verify-subscription?checkout_id=${checkoutId}`
        );
        const data = await response.json();

        if (response.ok) {
          setInvoice(data);
          console.log(data)
          setSubscriptionItem(data.subscription_item);
          setSubscriptionId(data.subscription);
          console.log(`subscription_item: ${data.subscription_item}, subscription_id: ${data.subscription}`)

          if (user) {
            const { error } = await supabase
              .from('profiles')
              .update({ subscription_item: data.subscription_item, subscription_id: data.subscription })
              .eq('id', user.id);

            if (error) throw error;
            console.error(error);
          }
        } else {
          throw new Error("Failed to fetch invoice data");
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
      }
    }

    fetchInvoice();
  }, []);

  return null;
}

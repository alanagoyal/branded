"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function VerifySubscription({ user }: { user: any }) {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutId = useMemo(
    () => searchParams.get("checkout_id"),
    [searchParams]
  );
  const customerId = useMemo(
    () => searchParams.get("customer_id"),
    [searchParams]
  );

  useEffect(() => {
    if (checkoutId) {
      fetchInvoice();
    }
    if (customerId) {
      fetchCustomer();
    }
  }, [checkoutId, customerId]);

  async function fetchInvoice() {
    try {
      const response = await fetch(
        `/verify-subscription?checkout_id=${checkoutId}`
      );
      const data = await response.json();

      if (response.ok) {
        const { error } = await supabase
          .from("profiles")
          .update({
            plan_id: data.planId,
            customer_id: data.customerId,
          })
          .eq("id", user.id);

        if (error) throw error;
      } else {
        throw new Error("Failed to fetch invoice data");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      router.push("/new");
    }
  }

  async function fetchCustomer() {
    try {
      const response = await fetch(
        `/update-subscription?customer_id=${customerId}`
      );
      const data = await response.json();

      if (response.ok) {
        const { error } = await supabase
          .from("profiles")
          .update({
            plan_id: data.cancelAtPeriodEnd ? null : data.planId,
            customer_id: data.cancelAtPeriodEnd ? null : customerId,
          })
          .eq("id", user.id);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    } finally {
      router.push("/new");
    }
  }

  return null;
}

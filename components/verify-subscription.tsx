"use client";

import { SUPPORT_NEW_ISSUE_URL } from "@/lib/support";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifySubscription({ user }: { user: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkout_id");
  const refreshBilling = searchParams.get("billing") === "refresh" || searchParams.has("customer_id");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || (!checkoutId && !refreshBilling)) return;
    let active = true;
    async function verify() {
      try {
        const response = await fetch(checkoutId ? "/verify-subscription" : "/update-subscription", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(checkoutId ? { checkoutId } : {}),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to verify billing.");
        if (active) { router.replace("/new"); router.refresh(); }
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : "Unable to verify billing.");
      }
    }
    void verify();
    return () => { active = false; };
  }, [checkoutId, refreshBilling, user, router]);

  return error ? <p role="alert">{error} <a className="underline" href={SUPPORT_NEW_ISSUE_URL}>Create a GitHub issue</a></p> : null;
}

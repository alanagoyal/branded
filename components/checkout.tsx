"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Checkout({ plan }: { plan: "pro" | "business" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/checkout-session", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to start checkout.");
      window.location.assign(result.url);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to start checkout.");
      setBusy(false);
    }
  }
  return <div className="mx-auto max-w-md space-y-4 p-8">
    <h1 className="text-2xl font-semibold">Subscribe to {plan === "pro" ? "Pro" : "Business"}</h1>
    <p>Review your subscription and payment details on Stripe.</p>
    <Button onClick={start} disabled={busy}>{busy ? "Opening checkout…" : "Continue to checkout"}</Button>
    {error && <p role="alert">{error} <a href="mailto:hi@basecase.vc" className="underline">Contact support</a></p>}
  </div>;
}

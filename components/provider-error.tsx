"use client";
import { ProviderRequestError } from "@/lib/provider-response";
import { ToastAction } from "./ui/toast";
import { toast } from "./ui/use-toast";

export function showProviderError(error: unknown) {
  const signIn = error instanceof ProviderRequestError && error.status === 401;
  const monthlyLimit = error instanceof ProviderRequestError && error.status === 429 && /monthly/i.test(error.message);
  toast({
    variant: "destructive",
    description: error instanceof Error ? error.message : "Unable to complete this request. Please try again.",
    ...(signIn || monthlyLimit ? { action: <ToastAction altText={signIn ? "Sign in" : "View plans"} onClick={() => window.location.assign(signIn ? "/login" : "/pricing")}>
      {signIn ? "Sign in" : "View plans"}
    </ToastAction> } : {}),
  });
}

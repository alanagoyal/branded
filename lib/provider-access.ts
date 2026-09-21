import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export class AccessError extends Error {
  constructor(public status: number, message: string, public retryAfter?: number) { super(message); }
}
export function accessError(error: unknown) {
  const status = error instanceof AccessError ? error.status : error instanceof z.ZodError || error instanceof SyntaxError ? 400 : 502;
  return NextResponse.json({ error: status === 400 ? "Invalid request." : error instanceof AccessError ? error.message : "Provider request failed. Please try again later." }, { status, headers: { "Cache-Control": "no-store", ...(error instanceof AccessError && error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {}) } });
}
export function adminClient() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function requireUser(req: Request) {
  const origin = req.headers.get("origin");
  if ((origin && origin !== new URL(req.url).origin) || req.headers.get("sec-fetch-site") === "cross-site") throw new AccessError(403, "Cross-site requests are not allowed.");
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user || (user as { is_anonymous?: boolean }).is_anonymous) throw new AccessError(401, "Sign in to continue.");
  return { user, client };
}
const limits = {
  names: [10, 100, 500], domains: [5, 50, 250], npm: [5, 50, 250],
  npmAvailability: [15, 150, 750], logos: [1, 5, 50], trademarks: [1, 5, 50],
  onePagerContent: [3, 25, 100], onePager: [3, 25, 100],
} as const;
export type Feature = keyof typeof limits;
export async function reserveUsage(userId: string, feature: Feature) {
  const admin = adminClient();
  const { data: billing, error } = await admin.from("billing_accounts").select("plan_tier,subscription_status,current_period_end").eq("user_id", userId).maybeSingle();
  if (error) throw new AccessError(503, "Billing verification is temporarily unavailable.");
  const paid = billing && ["active", "trialing"].includes(billing.subscription_status) && Date.parse(billing.current_period_end) > Date.now();
  const tier = paid && billing.plan_tier === "business" ? 2 : paid && billing.plan_tier === "pro" ? 1 : 0;
  // Reserve before provider work. Failures count as attempts: automatic refunds would
  // allow an attacker to create unlimited provider work by aborting requests.
  const { data, error: usageError } = await admin.rpc("reserve_provider_usage", { p_user_id: userId, p_feature: feature, p_limit: limits[feature][tier] });
  if (usageError) throw new AccessError(503, "Usage verification is temporarily unavailable.");
  if (data !== "ok") throw new AccessError(429, data === "monthly" ? "You've reached the monthly limit for this feature." : "Too many requests. Please wait a minute.", data === "monthly" ? undefined : 60);
}
export async function readBody<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  // Read incrementally: Content-Length is optional and cannot be trusted.
  const reader = req.body?.getReader();
  if (!reader) throw new AccessError(400, "A request body is required.");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    length += value.byteLength;
    if (length > 16000) { await reader.cancel(); throw new AccessError(413, "Request is too large."); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return schema.parse(JSON.parse(new TextDecoder().decode(bytes)));
}
export const nameSchema = z.string().trim().min(1).max(100);
export const descriptionSchema = z.string().trim().min(1).max(4000);

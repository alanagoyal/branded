// Operator-only reconciliation of manually verified legacy ownership.
// Default is read-only. See docs/billing-rollout.md before using --apply.
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const path = require("node:path");
const args = process.argv.slice(2);
const input = args[args.indexOf("--input") + 1];
if (!args.includes("--input") || !input) throw new Error("Usage: node --env-file=.env.local scripts/reconcile-billing.cjs --input /private/path/verified-mappings.json [--apply]");
const apply = args.includes("--apply");
const mappings = JSON.parse(fs.readFileSync(input, "utf8"));
if (!Array.isArray(mappings) || mappings.some(m => !m.userId || !m.customerId || m.ownershipVerified !== true || !m.evidenceReference)) {
  throw new Error("Each mapping needs userId, customerId, ownershipVerified: true, and evidenceReference.");
}
if (!process.env.STRIPE_PRO_PRICE_ID || !process.env.STRIPE_BUSINESS_PRICE_ID) throw new Error("Configure both recurring Stripe price IDs first.");
const moduleExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "../lib/billing-state.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: moduleExports });
const { billingSnapshot } = moduleExports;
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
async function main() {
  for (const mapping of mappings) {
    const { data: { user }, error: userError } = await admin.auth.admin.getUserById(mapping.userId);
    if (userError || !user) throw new Error("A manifest user does not exist.");
    const customer = await stripe.customers.retrieve(mapping.customerId);
    if (customer.deleted) throw new Error("A manifest customer has been deleted.");
    const { data: account, error } = await admin.from("billing_accounts").select("*").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    if (account && account.customer_id !== customer.id) throw new Error("Existing trusted mapping differs; refusing reassignment.");
    const subscriptions = [];
    for await (const subscription of stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 100 })) subscriptions.push(subscription);
    const snapshot = billingSnapshot(subscriptions, { pro: process.env.STRIPE_PRO_PRICE_ID, business: process.env.STRIPE_BUSINESS_PRICE_ID });
    if (apply) {
      if (!account) {
        const { error: insertError } = await admin.from("billing_accounts").insert({ user_id: user.id, customer_id: customer.id });
        if (insertError) throw insertError;
      }
      const { data: applied, error: applyError } = await admin.rpc("apply_billing_snapshot", {
        p_customer_id: customer.id, p_revision: account?.revision ?? 0, p_snapshot: snapshot,
      });
      if (applyError) throw applyError;
      if (!applied) throw new Error("Concurrent billing update; rerun reconciliation to fetch fresh state.");
    }
  }
  console.log(`${apply ? "Reconciled" : "Validated (dry run)"} ${mappings.length} manually verified mappings.`);
}
main().catch(() => { console.error("Reconciliation stopped. Check the manifest, provider access, and database schema. No ownership reassignment was attempted; earlier rows may have completed in apply mode."); process.exitCode = 1; });

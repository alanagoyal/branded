const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, mocks = {}, env = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require: name => {
    if (!(name in mocks)) throw new Error(`Unexpected import ${name}`);
    return mocks[name];
  }, Response, Date, process: { env }, console: { error() {}, warn() {} } });
  return exports;
}
const { billingSnapshot } = load("lib/billing-state.ts");
const prices = { pro: "price_pro", business: "price_business" };
const now = 2000000000000;
function subscription(overrides = {}) {
  return { id: "sub_1", status: "active", created: 1, current_period_end: now / 1000 + 1000,
    cancel_at_period_end: false, items: { data: [{ price: { id: "price_pro", product: "prod_pro" } }] }, ...overrides };
}
test("scheduled cancellation retains paid access and customer state until expiration", () => {
  const state = billingSnapshot([subscription({ cancel_at_period_end: true })], prices, now);
  assert.equal(state.plan_tier, "pro");
  assert.equal(state.plan_id, "prod_pro");
  assert.equal(state.cancel_at_period_end, true);
  assert.equal(billingSnapshot([subscription({ current_period_end: now / 1000 })], prices, now).plan_tier, "free");
});
for (const status of ["canceled", "past_due", "unpaid", "paused", "incomplete", "incomplete_expired"]) {
  test(`${status} does not confer paid access`, () => {
    const state = billingSnapshot([subscription({ status })], prices, now);
    assert.equal(state.plan_tier, "free");
    assert.equal(state.plan_id, null);
  });
}
test("active allowed plan wins over a newer canceled record; business wins over pro", () => {
  const business = subscription({ id: "sub_business", items: { data: [{ price: { id: "price_business", product: "prod_business" } }] } });
  assert.equal(billingSnapshot([subscription({ status: "canceled", created: 2 }), subscription()], prices, now).plan_tier, "pro");
  assert.equal(billingSnapshot([subscription(), business], prices, now).plan_tier, "business");
});
test("unrecognized or missing price configuration fails closed", () => {
  assert.equal(billingSnapshot([subscription()], {}, now).plan_tier, "free");
  assert.equal(billingSnapshot([], prices, now).subscription_id, null);
});

const user = { id: "user_owner", email: "owner@example.com", email_confirmed_at: "2026-01-01" };
const account = { user_id: user.id, customer_id: "cus_owner", revision: 0 };
function route(file, options = {}) {
  const calls = [];
  class BillingError extends Error { constructor(message, status = 409) { super(message); this.status = status; } }
  const stripe = {
    billingPortal: { sessions: { create: async params => { calls.push(["portal", params]); return { url: "https://billing.stripe.com/test" }; } } },
    checkout: { sessions: { retrieve: async id => { calls.push(["checkout", id]); return options.session ?? { customer: account.customer_id, client_reference_id: user.id, status: "complete" }; } } },
  };
  const mocks = {
    "@/lib/plans": { baseUrl: "https://www.branded.ai" },
    "@/lib/billing": {
      BillingError,
      billingUser: async () => { if (options.anonymous) throw new BillingError("Sign in", 401); return user; },
      billingAccount: async id => { calls.push(["account", id]); return options.unmapped ? null : account; },
      requireBillingOrigin: request => { if (request.headers.get("origin") !== new URL(request.url).origin) throw new BillingError("Bad origin", 403); },
      billingFailure: error => Response.json({ error: error.message }, { status: error.status ?? 503 }),
      stripeClient: () => stripe,
      syncBilling: async (...args) => { calls.push(["sync", args[1]]); if (options.syncFails) throw new Error("Database down"); },
    },
  };
  return { ...load(file, mocks), calls };
}
function request(body = {}, origin = "https://www.branded.ai") {
  return new Request("https://www.branded.ai/billing?customer_id=cus_victim", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
for (const file of ["app/portal-session/route.ts", "app/verify-subscription/route.ts", "app/update-subscription/route.ts"]) {
  test(`${file} requires authentication before provider access`, async () => {
    const r = route(file, { anonymous: true });
    assert.equal((await r.POST(request())).status, 401);
    assert.equal(r.calls.length, 0);
  });
  test(`${file} rejects cross-origin requests`, async () => {
    const r = route(file);
    assert.equal((await r.POST(request({}, "https://attacker.example"))).status, 403);
    assert.equal(r.calls.length, 0);
  });
}
test("portal uses trusted ownership and ignores supplied customer ID", async () => {
  const r = route("app/portal-session/route.ts");
  assert.equal((await r.POST(request({ customer_id: "cus_victim" }))).status, 200);
  assert.equal(r.calls[1][1].customer, account.customer_id);
});
test("legacy unmapped portal access fails closed", async () => {
  const r = route("app/portal-session/route.ts", { unmapped: true });
  assert.equal((await r.POST(request())).status, 409);
  assert.equal(r.calls.length, 1);
});
for (const session of [{ customer: "cus_victim", client_reference_id: user.id }, { customer: account.customer_id, client_reference_id: "victim" }]) {
  test(`checkout does not disclose or link someone else's checkout ${JSON.stringify(session)}`, async () => {
    const r = route("app/verify-subscription/route.ts", { session: { ...session, status: "complete" } });
    assert.equal((await r.POST(request({ checkoutId: "cs_test_id" }))).status, 403);
    assert.ok(!r.calls.some(([op]) => op === "sync"));
  });
}
test("checkout success returns no invoice or billing details and syncs on server", async () => {
  const r = route("app/verify-subscription/route.ts");
  const response = await r.POST(request({ checkoutId: "cs_test_id" }));
  assert.deepEqual(await response.json(), { verified: true });
  assert.equal(r.calls.at(-1)[1], account.customer_id);
});
test("refresh uses trusted ownership and dependency failure is not success", async () => {
  const r = route("app/update-subscription/route.ts", { syncFails: true });
  assert.equal((await r.POST(request({ customer_id: "cus_victim" }))).status, 503);
  assert.equal(r.calls.at(-1)[1], account.customer_id);
});

function webhook({ badSignature = false, syncFails = false, type = "customer.subscription.updated", missingSecret = false } = {}) {
  const calls = [];
  return { ...load("app/api/webhook/stripe/route.ts", { "@/lib/billing": {
    stripeClient: () => ({ webhooks: { constructEvent: () => {
      if (badSignature) throw new Error("bad signature");
      return { id: "evt_test", type, data: { object: { customer: "cus_owner" } } };
    } } }),
    syncBilling: async (...args) => { calls.push(args.slice(1)); if (syncFails) throw new Error("DB down"); return account; },
  } }, missingSecret ? {} : { STRIPE_ENDPOINT_SECRET: "whsec_test" }), calls };
}
test("webhook signature failures are 400; processing failures are retryable 500", async () => {
  assert.equal((await webhook({ badSignature: true }).POST(request())).status, 400);
  assert.equal((await webhook({ syncFails: true }).POST(request())).status, 500);
  assert.equal((await webhook({ missingSecret: true }).POST(request())).status, 503);
});
for (const type of ["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "invoice.paid", "invoice.payment_failed"]) {
  test(`webhook synchronizes ${type} with an idempotency key`, async () => {
    const r = webhook({ type });
    assert.equal((await r.POST(request())).status, 200);
    assert.deepEqual(Array.from(r.calls[0]), ["cus_owner", "evt_test"]);
  });
}
test("unhandled webhook events are acknowledged without billing changes", async () => {
  const r = webhook({ type: "payment_intent.created" });
  assert.equal((await r.POST(request())).status, 200);
  assert.equal(r.calls.length, 0);
});

function syncFixture({ duplicate = false, conflict = false } = {}) {
  const calls = [];
  let revision = 0;
  const admin = {
    from(table) { return { select() { return this; }, eq() { return this; }, async maybeSingle() {
      return { data: table === "billing_accounts" ? { ...account, revision } : duplicate ? { event_id: "evt_1" } : null, error: null };
    } }; },
    async rpc(name, params) {
      calls.push(["apply", params.p_revision]);
      if (conflict && revision === 0) { revision++; return { data: false, error: null }; }
      return { data: true, error: null };
    },
  };
  const { syncBilling } = load("lib/billing.ts", {
    "server-only": {}, stripe: class Stripe {}, "@/utils/supabase/server": {},
    "@/supabase/admin": { supabaseAdmin: async () => admin }, "@/lib/billing-state": { billingSnapshot },
  }, { STRIPE_PRO_PRICE_ID: "price_pro" });
  const stripe = { subscriptions: { list() { calls.push(["fetch"]); return (async function* () { yield subscription(); })(); } } };
  return { calls, run: () => syncBilling(stripe, account.customer_id, "evt_1") };
}
test("duplicate event avoids a second Stripe fetch and write", async () => {
  const fixture = syncFixture({ duplicate: true }); await fixture.run(); assert.equal(fixture.calls.length, 0);
});
test("concurrent snapshot conflict refetches Stripe and retries with a fresh revision", async () => {
  const fixture = syncFixture({ conflict: true }); await fixture.run();
  assert.deepEqual(fixture.calls, [["fetch"], ["apply", 0], ["fetch"], ["apply", 1]]);
});

function checkoutFixture(options = {}) {
  const calls = [];
  let mapped = options.fresh ? null : account;
  let createAttempts = 0;
  class BillingError extends Error { constructor(message, status = 409) { super(message); this.status = status; } }
  const stripe = {
    customers: {
      list: async () => ({ data: options.legacyEmail ? [{ id: "cus_legacy" }] : [] }),
      create: async params => { calls.push(["createCustomer", params]); return { id: "cus_owner" }; },
    },
    subscriptions: { list: () => (async function* () { if (options.subscribed) yield { status: "active" }; })() },
    checkout: { sessions: { create: async (params, settings) => { calls.push(["checkout", params, settings]); if (options.createError && createAttempts++ === 0) throw options.createError; return { url: "https://checkout.stripe.com/test" }; } } },
  };
  const admin = {
    from(table) { return {
      select() { return this; }, eq() { return this; },
      single: async () => ({ data: { customer_id: options.legacyProfile ? "cus_legacy" : null } }),
      insert: async data => { calls.push(["map", data]); mapped = account; return {}; },
      update() { return this; }, then(resolve) { resolve({}); },
    }; },
    rpc: async (name, params) => { calls.push(["rpc", name, params]); return { data: options.deleting ? null : { token: "checkout-attempt", plan: options.otherPlan ? "business" : "pro", expires_at: name === "renew_billing_checkout" ? 2000000000 : options.stale ? 1 : 2000000000 } }; },
  };
  const { POST } = load("app/checkout-session/route.ts", {
    "@/lib/plans": { baseUrl: "https://www.branded.ai" },
    "@/supabase/admin": { supabaseAdmin: async () => admin },
    "@/lib/billing": {
      BillingError,
      billingUser: async () => { if (options.anonymous) throw new BillingError("Sign in", 401); return { ...user, email_confirmed_at: options.unverified ? null : user.email_confirmed_at }; },
      billingAccount: async () => mapped,
      billingPrices: () => options.unconfigured ? {} : prices,
      stripeClient: () => stripe,
      requireBillingOrigin: req => { if (req.headers.get("origin") !== new URL(req.url).origin) throw new BillingError("Bad origin", 403); },
      billingFailure: error => Response.json({ error: error.message }, { status: error.status ?? 503 }),
    },
  });
  return { POST, calls };
}
for (const [options, status] of [
  [{ anonymous: true }, 401], [{ unverified: true }, 403], [{ unconfigured: true }, 503],
  [{ fresh: true, legacyEmail: true }, 409], [{ fresh: true, legacyProfile: true }, 409],
  [{ subscribed: true }, 409], [{ otherPlan: true }, 409], [{ deleting: true }, 409],
]) {
  test(`checkout prevents unsafe or duplicate creation: ${JSON.stringify(options)}`, async () => {
    const r = checkoutFixture(options);
    assert.equal((await r.POST(request({ plan: "pro" }))).status, status);
    assert.ok(!r.calls.some(([op]) => op === "checkout"));
  });
}
test("new checkout maps only authenticated owner and uses a server price and reserved attempt", async () => {
  const r = checkoutFixture({ fresh: true });
  assert.equal((await r.POST(request({ plan: "pro", customer_id: "cus_victim", userId: "victim", price: "price_forged" }))).status, 200);
  const mapped = r.calls.find(([op]) => op === "map")[1];
  assert.equal(mapped.user_id, user.id);
  assert.equal(mapped.customer_id, account.customer_id);
  const [, session, settings] = r.calls.find(([op]) => op === "checkout");
  assert.equal(session.customer, account.customer_id);
  assert.equal(session.client_reference_id, user.id);
  assert.equal(session.line_items[0].price, prices.pro);
  assert.equal(settings.idempotencyKey, "branded-checkout-checkout-attempt");
  assert.equal(session.expires_at, 2000000000);
});

test("stale uncreated checkout renews expiration with the same idempotency key", async () => {
  const r = checkoutFixture({ stale: true, createError: { type: "StripeInvalidRequestError", param: "expires_at" } });
  assert.equal((await r.POST(request({ plan: "pro" }))).status, 200);
  const attempts = r.calls.filter(([op]) => op === "checkout");
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0][1].expires_at, 1);
  assert.equal(attempts[1][1].expires_at, 2000000000);
  assert.equal(attempts[0][2].idempotencyKey, attempts[1][2].idempotencyKey);
  const renew = r.calls.find(call => call[1] === "renew_billing_checkout");
  assert.equal(renew[2].p_token, "checkout-attempt");
  assert.equal(renew[2].p_expires_at, 1);
});
for (const error of [{ type: "StripeConnectionError" }, { type: "StripeAPIError" }, { type: "StripeInvalidRequestError", code: "idempotency_key_in_use" }, { type: "StripeInvalidRequestError", param: "price" }]) {
  test(`ambiguous/other checkout failure never renews reservation: ${JSON.stringify(error)}`, async () => {
    const r = checkoutFixture({ stale: true, createError: error });
    assert.equal((await r.POST(request({ plan: "pro" }))).status, 503);
    assert.ok(!r.calls.some(call => call[1] === "renew_billing_checkout"));
  });
}

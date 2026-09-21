const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

// Exercise the actual TypeScript modules with fake external services. No live
// accounts, subscriptions, or database records are changed by these tests.
function load(file, mocks = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports, require: (name) => {
      if (!(name in mocks)) throw new Error(`Unexpected import: ${name}`);
      return mocks[name];
    }, process: { env: { STRIPE_SECRET_KEY: "test" } }, console: { error() {} },
  });
  return exports;
}
const { checkDeletionBilling } = load("lib/account-deletion.ts");
const email = "owner@example.com";
const iterable = (items) => (async function* () { yield* items; })();

function billing({ linkedEmail = email, customers = [], subscriptions = [], schedules = [], deleted = false } = {}) {
  const calls = [];
  return {
    calls,
    customers: {
      retrieve: async (id) => ({ id, email: linkedEmail, deleted }),
      list: (params) => { calls.push(["customers", params]); return iterable(customers); },
    },
    subscriptions: {
      list: (params) => { calls.push(["subscriptions", params]); return iterable(subscriptions); },
    },
    subscriptionSchedules: {
      list: (params) => { calls.push(["schedules", params]); return iterable(schedules); },
    },
  };
}

test("free account without Stripe customers can be deleted", async () => {
  assert.equal(await checkDeletionBilling(billing(), email, null), null);
});
test("user-editable customer ID cannot authorize access to another billing account", async () => {
  const stripe = billing({ linkedEmail: "someone-else@example.com" });
  assert.match(await checkDeletionBilling(stripe, email, "cus_other"), /couldn't verify/);
  assert.equal(stripe.calls.length, 0);
});
test("email lookup catches a renewing subscription even when customer_id was lost", async () => {
  const stripe = billing({ customers: [{ id: "cus_recovered" }], subscriptions: [{ status: "active" }] });
  assert.match(await checkDeletionBilling(stripe, email, null), /cancel your subscription/);
  assert.equal(stripe.calls[1][1].customer, "cus_recovered");
});
for (const status of ["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]) {
  test(`${status} subscriptions block deletion until cancellation is scheduled`, async () => {
    assert.match(await checkDeletionBilling(billing({ subscriptions: [{ status }] }), email, "cus_1"), /cancel your subscription/);
  });
}
for (const subscription of [
  { status: "canceled" }, { status: "incomplete_expired" },
  { status: "active", cancel_at_period_end: true },
  { status: "active", cancel_at: 1800000000 },
]) {
  test(`allows ended or scheduled cancellation: ${JSON.stringify(subscription)}`, async () => {
    assert.equal(await checkDeletionBilling(billing({ subscriptions: [subscription] }), email, "cus_1"), null);
  });
}
test("checks every customer and subscription instead of only the first result", async () => {
  const stripe = billing({ customers: [{ id: "cus_1" }, { id: "cus_2" }] });
  stripe.subscriptions.list = ({ customer }) => iterable(customer === "cus_2" ? [{ status: "canceled" }, { status: "active" }] : []);
  assert.match(await checkDeletionBilling(stripe, email, null), /cancel your subscription/);
});
for (const status of ["active", "not_started"]) {
  test(`${status} subscription schedule blocks deletion`, async () => {
    assert.match(await checkDeletionBilling(billing({ schedules: [{ status }] }), email, "cus_1"), /subscription schedule/);
  });
}
test("Stripe lookup errors fail closed", async () => {
  const stripe = billing();
  stripe.customers.retrieve = async () => { throw new Error("Stripe unavailable"); };
  await assert.rejects(checkDeletionBilling(stripe, email, "cus_1"), /Stripe unavailable/);
});
test("already deleted Stripe customer does not block account deletion", async () => {
  assert.equal(await checkDeletionBilling(billing({ deleted: true }), email, "cus_deleted"), null);
});

function route({ user = { id: "authenticated-user", email }, authError = null, profileError = null,
  billingError = null, billingThrows = false, signOutError = null, deleteError = null, mappingReadError = null, trustedCustomerId = null } = {}) {
  const calls = [];
  const checks = [];
  let table;
  const supabase = { auth: {
    getUser: async () => ({ data: { user }, error: authError }),
    signOut: async () => { calls.push(["signOut"]); return { error: signOutError }; },
  } };
  const query = {
    select() { return this; },
    eq(key, value) { calls.push([table === "billing_accounts" ? "billing" : "profile", key, value]); return this; },
    maybeSingle: async () => table === "billing_accounts"
      ? ({ data: trustedCustomerId ? { customer_id: trustedCustomerId } : null, error: mappingReadError })
      : ({ data: { customer_id: "cus_1" }, error: profileError }),
  };
  const admin = {
    from: (name) => { table = name; return query; },
    auth: { admin: { deleteUser: async (id) => { calls.push(["delete", id]); return { error: deleteError }; } } },
  };
  const { POST } = load("app/account/delete/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    stripe: class Stripe {},
    "@/utils/supabase/server": { createClient: () => supabase },
    "@/supabase/admin": { supabaseAdmin: async () => admin },
    "@/lib/account-deletion": { checkDeletionBilling: async (...args) => {
      checks.push(args.slice(1));
      if (billingThrows) throw new Error("Stripe unavailable");
      return billingError;
    } },
  });
  return { POST, calls, checks };
}
function request({ origin = "https://www.branded.ai", confirmation = "DELETE", malformed = false } = {}) {
  return {
    headers: new Headers(origin ? { origin } : {}),
    nextUrl: new URL("https://www.branded.ai/account/delete"),
    json: async () => {
      if (malformed) throw new Error("Invalid JSON");
      return { confirmation, userId: "victim", customerId: "cus_victim" };
    },
  };
}
test("deletes only authenticated user, ignoring caller-supplied identities", async () => {
  const { POST, calls } = route();
  assert.equal((await POST(request())).status, 200);
  assert.deepEqual(calls, [["profile", "id", "authenticated-user"], ["billing", "user_id", "authenticated-user"], ["signOut"], ["delete", "authenticated-user"]]);
});
for (const origin of ["https://attacker.example", null]) {
  test(`rejects invalid or missing origin: ${origin}`, async () => {
    const { POST, calls } = route();
    assert.equal((await POST(request({ origin }))).status, 403);
    assert.equal(calls.length, 0);
  });
}
for (const input of [{ confirmation: "delete" }, { malformed: true }]) {
  test(`rejects unconfirmed/malformed deletion: ${JSON.stringify(input)}`, async () => {
    const { POST, calls } = route();
    assert.equal((await POST(request(input))).status, 400);
    assert.equal(calls.length, 0);
  });
}
test("unauthenticated requests cannot delete", async () => {
  const { POST, calls } = route({ user: null });
  assert.equal((await POST(request())).status, 401);
  assert.equal(calls.length, 0);
});
for (const failure of [{ profileError: new Error("DB unavailable") }, { mappingReadError: new Error("Billing DB unavailable") }, { billingThrows: true }, { signOutError: new Error("Auth unavailable") }]) {
  test(`dependency failure does not delete account: ${Object.keys(failure)[0]}`, async () => {
    const { POST, calls } = route(failure);
    assert.equal((await POST(request())).status, 500);
    assert.ok(!calls.some(([operation]) => operation === "delete"));
  });
}
test("billing block leaves user signed in with account intact", async () => {
  const { POST, calls } = route({ billingError: "Cancel first" });
  assert.equal((await POST(request())).status, 409);
  assert.deepEqual(calls.map(([op]) => op), ["profile", "billing"]);
});
test("failed auth deletion is never reported as success", async () => {
  const { POST } = route({ deleteError: new Error("Deletion failed") });
  const result = await POST(request());
  assert.equal(result.status, 500);
  assert.match(result.body.error, /sign in and try again/);
});

test("former build-info URL follows normal middleware instead of exposing environment", async () => {
  const response = { ordinaryResponse: true };
  const seen = [];
  const { middleware } = load("middleware.ts", {
    "@/utils/supabase/middleware": { updateSession: async (request) => {
      seen.push(request.nextUrl.pathname);
      return response;
    } },
  });
  assert.equal(await middleware({ nextUrl: new URL("https://www.branded.ai/_build_info") }), response);
  assert.deepEqual(seen, ["/_build_info"]);
});


test("deletion checks authoritative mapping independently from the profile mirror", async () => {
  const { POST, checks } = route({ trustedCustomerId: "cus_canonical" });
  assert.equal((await POST(request())).status, 200);
  assert.deepEqual(Array.from(checks[0]), [email, "cus_1", "cus_canonical"]);
});
test("trusted mapping catches renewed billing when mirror is missing and emails changed", async () => {
  const stripe = billing({ linkedEmail: "old@example.com", subscriptions: [{ status: "active" }] });
  assert.match(await checkDeletionBilling(stripe, email, null, "cus_canonical"), /cancel your subscription/);
  assert.equal(stripe.calls.find(([op]) => op === "subscriptions")[1].customer, "cus_canonical");
});
test("verified mapping allows scheduled cancellation despite changed billing email", async () => {
  const stripe = billing({ linkedEmail: "old@example.com", subscriptions: [{ status: "active", cancel_at_period_end: true }] });
  assert.equal(await checkDeletionBilling(stripe, email, "cus_canonical", "cus_canonical"), null);
});
test("trusted mapping does not skip a separate legacy linked customer or email-discovered customer", async () => {
  const stripe = billing({ customers: [{ id: "cus_email" }] });
  stripe.subscriptions.list = ({ customer }) => {
    stripe.calls.push(["subscriptions", { customer }]);
    return iterable(customer === "cus_email" ? [{ status: "active" }] : []);
  };
  assert.match(await checkDeletionBilling(stripe, email, "cus_legacy", "cus_canonical"), /cancel your subscription/);
  assert.deepEqual(stripe.calls.filter(([op]) => op === "subscriptions").map(([, params]) => params.customer), ["cus_canonical", "cus_legacy", "cus_email"]);
});
test("canonical Stripe lookup failure leaves deletion blocked", async () => {
  const stripe = billing();
  stripe.customers.retrieve = async () => { throw new Error("Stripe unavailable"); };
  await assert.rejects(checkDeletionBilling(stripe, email, null, "cus_canonical"), /Stripe unavailable/);
});

// Requires @electric-sql/pglite@0.5.8 via NODE_PATH; see docs/billing-rollout.md.
const { PGlite } = require("@electric-sql/pglite");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
async function main() {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated;
      create table public.profiles(id uuid primary key, name text, email text, updated_at timestamptz);
      alter table public.profiles enable row level security;
      grant all on public.profiles to anon, authenticated, service_role;
      create policy profiles_owner on public.profiles to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
      insert into profiles(id) values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
    `);
    await db.exec(fs.readFileSync(path.join(__dirname, "../supabase/migrations/20260921145451_server_owned_billing.sql"), "utf8"));
    await db.exec(fs.readFileSync(path.join(__dirname, "../supabase/migrations/20260921162256_billing_checkout_deletion_guards.sql"), "utf8"));
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';`);
    for (const sql of [
      "update profiles set customer_id = 'cus_victim'",
      "update profiles set account_deletion_token = gen_random_uuid()",
      "select begin_account_deletion('00000000-0000-0000-0000-000000000001')",
      "select finish_account_deletion('00000000-0000-0000-0000-000000000001', gen_random_uuid())",
      "select renew_billing_checkout('00000000-0000-0000-0000-000000000001', gen_random_uuid(), 1)",
      "update profiles set plan_id = 'prod_business'",
      "insert into profiles(id, customer_id) values ('00000000-0000-0000-0000-000000000003', 'cus_victim')",
      "delete from profiles",
      "insert into billing_accounts(user_id, customer_id) values ('00000000-0000-0000-0000-000000000001', 'cus_victim')",
      "update billing_accounts set plan_tier = 'business'",
      "select apply_billing_snapshot('cus_owner', 0, '{}'::jsonb)",
      "select reserve_billing_checkout('00000000-0000-0000-0000-000000000001', 'pro')",
    ]) await assert.rejects(db.exec(sql), /permission denied/);
    await db.exec("update profiles set name = 'Owner' where id = '00000000-0000-0000-0000-000000000001'");
    assert.equal((await db.query("select name from profiles")).rows[0].name, "Owner");
    await db.exec(`reset role; insert into billing_accounts(user_id, customer_id) values
      ('00000000-0000-0000-0000-000000000001', 'cus_owner'),
      ('00000000-0000-0000-0000-000000000002', 'cus_other');
      set role authenticated;`);
    assert.equal((await db.query("select * from billing_accounts")).rows.length, 1);
    await db.exec("reset role; set role anon");
    await assert.rejects(db.query("select * from billing_accounts"), /permission denied/);
    await db.exec("reset role; set role service_role");
    const reserve = plan => db.query("select reserve_billing_checkout($1, $2) as attempt", ["00000000-0000-0000-0000-000000000001", plan]);
    const first = (await reserve("pro")).rows[0].attempt;
    assert.deepEqual((await reserve("pro")).rows[0].attempt, first, "repeat checkout reuses attempt");
    assert.deepEqual((await reserve("business")).rows[0].attempt, first, "parallel different plan cannot replace attempt");
    await db.exec("update billing_accounts set checkout_expires_at = now() - interval '1 minute' where customer_id = 'cus_owner'");
    const next = (await reserve("business")).rows[0].attempt;
    assert.notEqual(next.token, first.token);
    assert.equal(next.plan, "business");
    const uid = "00000000-0000-0000-0000-000000000001";
    const begin = () => db.query("select begin_account_deletion($1) as token", [uid]);
    const finish = token => db.query("select finish_account_deletion($1, $2)", [uid, token]);
    assert.equal((await begin()).rows[0].token, null, "checkout first blocks deletion");
    await db.exec("update billing_accounts set checkout_expires_at = now() - interval '1 minute' where customer_id = 'cus_owner'");
    const guard = (await begin()).rows[0].token;
    assert.ok(guard);
    assert.equal((await begin()).rows[0].token, null, "second deletion cannot acquire guard");
    assert.equal((await reserve("pro")).rows[0].attempt, null, "deletion first blocks checkout");
    assert.equal((await db.query("select renew_billing_checkout($1, $2, $3) as attempt", [uid, next.token, next.expires_at])).rows[0].attempt, null, "deletion blocks stale checkout retry");
    await finish("00000000-0000-0000-0000-000000000099");
    assert.equal((await reserve("pro")).rows[0].attempt, null, "wrong token cannot unlock deletion");
    await finish(guard);
    const recover = (await reserve("pro")).rows[0].attempt;
    assert.ok(recover.token);
    await db.exec("update billing_accounts set checkout_expires_at = date_trunc('second', now()) + interval '20 minutes' where customer_id = 'cus_owner'");
    const oldExpiry = (await db.query("select extract(epoch from checkout_expires_at)::bigint as expiry from billing_accounts where customer_id = 'cus_owner'")).rows[0].expiry;
    const renew = (token, expiry) => db.query("select renew_billing_checkout($1, $2, $3) as attempt", [uid, token, expiry]);
    const renewed = (await renew(recover.token, oldExpiry)).rows[0].attempt;
    assert.equal(renewed.token, recover.token, "renew retains Stripe idempotency key");
    assert.ok(renewed.expires_at > Number(oldExpiry) + 14 * 60);
    assert.deepEqual((await renew(recover.token, oldExpiry)).rows[0].attempt, renewed, "racing renewals reuse one expiration");
    assert.equal((await renew(next.token, next.expires_at)).rows[0].attempt, null, "stale attempt cannot replace current reservation");
    await db.exec("insert into profiles(id) values ('00000000-0000-0000-0000-000000000003')");
    const newUid = "00000000-0000-0000-0000-000000000003";
    assert.ok((await db.query("select begin_account_deletion($1) as token", [newUid])).rows[0].token);
    await db.query("insert into billing_accounts(user_id, customer_id) values ($1, 'cus_new')", [newUid]);
    assert.equal((await db.query("select reserve_billing_checkout($1, 'pro') as attempt", [newUid])).rows[0].attempt, null, "mapping created after deletion starts still cannot check out");
    const snapshot = { plan_id: "prod_pro", plan_tier: "pro", subscription_id: "sub_owner", subscription_status: "active", current_period_end: "2099-01-01T00:00:00Z", cancel_at_period_end: true };
    const apply = (revision, state, event) => db.query("select apply_billing_snapshot($1, $2, $3::jsonb, $4) as applied", ["cus_owner", revision, JSON.stringify(state), event]);
    assert.equal((await apply(0, snapshot, "evt_1")).rows[0].applied, true);
    assert.equal((await db.query("select revision from billing_accounts where customer_id = 'cus_owner'")).rows[0].revision, 1);
    assert.equal((await apply(0, snapshot, "evt_1")).rows[0].applied, true, "duplicate acknowledged");
    assert.equal((await apply(0, { ...snapshot, plan_id: null }, "evt_old")).rows[0].applied, false, "stale snapshot refused");
    assert.equal((await db.query("select count(*)::int as count from billing_webhook_events")).rows[0].count, 1);
    await assert.rejects(apply(1, { ...snapshot, plan_tier: "invalid" }, "evt_failed"), /check constraint/);
    assert.equal((await db.query("select count(*)::int as count from billing_webhook_events")).rows[0].count, 1, "failed transaction did not mark event delivered");
    assert.equal((await db.query("select plan_id from profiles where id = '00000000-0000-0000-0000-000000000001'")).rows[0].plan_id, "prod_pro");
    await apply(1, { ...snapshot, plan_id: null, plan_tier: "free", subscription_status: "canceled" }, "evt_2");
    assert.equal((await db.query("select customer_id from profiles where id = '00000000-0000-0000-0000-000000000001'")).rows[0].customer_id, "cus_owner", "cancellation preserves customer mapping");
    console.log("Billing SQL checks passed: role/column permissions, owner reads, atomic snapshot/dedupe, stale revision and rollback, preserved customer identity.");
  } finally { await db.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

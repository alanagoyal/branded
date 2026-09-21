# Billing security rollout

This change requires a database migration and server configuration before deploying the application. It does not cancel subscriptions or change Stripe charges.

## Deploy in this order

1. Configure `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_ENDPOINT_SECRET`, `STRIPE_PRO_PRICE_ID`, and `STRIPE_BUSINESS_PRICE_ID` in the server environment. The last two are existing recurring `price_...` IDs, not `prod_...` IDs. Use test prices with a test key and live prices with a live key. All supported paid subscriptions must use those prices; unknown prices fail closed to free entitlements. Review any historical prices before rollout and migrate/extend the explicit allowlist as necessary.
2. Apply `20260921145451_server_owned_billing.sql` using the normal reviewed migration process. Do not insert trusted ownership from the old `profiles.customer_id` or `profiles.plan_id` columns. Those were client-writable.
3. Reconcile existing paying customers as described below, **before deploying this application or enabling server quotas**. Otherwise unreconciled users receive free entitlements and billing portal requests direct them to support. The quota migration depends on `billing_accounts` and must follow this migration.
4. Deploy this application version. There may be a brief interval between the migration and application deployment when old browser billing writes fail; reload the app after deployment.
5. Configure the Stripe webhook for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.paid`, `invoice.payment_failed`, and `invoice.payment_action_required`. Keep the endpoint signing secret in the server environment. Retire old public Payment Links after verifying the authenticated checkout flow; historical links cannot establish account ownership.
6. In Stripe test mode verify checkout, portal return, scheduled cancellation, resumed subscription, immediate cancellation, failed payment, duplicate event delivery, and webhook retry after a simulated database failure. Production changes were not applied by this PR.

## Reconcile historical customer ownership

Use original support correspondence, checkout/payment records, and authenticated account confirmation to establish the actual account owner. Neither a profile column nor a matching email alone proves ownership. Case differences, changed emails, deleted profile links, and multiple Stripe customer records require manual review. Preserve the evidence reference in an access-controlled incident/support record, not the repository. Unresolved mappings must stay unmapped; do not guess.

Create a private JSON manifest outside the repository:

```json
[
  {
    "userId": "verified-auth-user-uuid",
    "customerId": "cus_verified_customer",
    "ownershipVerified": true,
    "evidenceReference": "private support record reference"
  }
]
```

With the correct server environment loaded, run:

```sh
node --env-file=.env.local scripts/reconcile-billing.cjs --input /private/path/verified-mappings.json
node --env-file=.env.local scripts/reconcile-billing.cjs --input /private/path/verified-mappings.json --apply
```

The first command only validates users, customers, existing mappings, and current subscriptions. The second creates missing trusted mappings and refreshes state with a compare-and-swap RPC. It refuses reassignment of an existing trusted mapping and duplicate Stripe ownership through the unique constraint. It never changes a Stripe customer, subscription, payment, or email. Apply mode can partially complete a manifest; fix the failing record and rerun. Do not run two reconciliations for the same account concurrently.

One trusted customer is supported per user. If a user has several historical Stripe customer records, resolve duplicate subscriptions and confirm the canonical billing customer through support before mapping. Account deletion continues to check the profile link plus all exact-email matches; the historical changed-email caveat remains until reconciliation resolves it.

## Security and lifecycle semantics

`billing_accounts` is authoritative. Only the service role can write it or call the snapshot RPC. The browser can read its own row. Browser profile inserts/deletes are revoked, and profile updates are limited to name, email, and updated timestamp. Auth's existing profile-creation trigger still works. Profile billing fields are compatibility mirrors for the UI, never authorization inputs.

A transaction reserves one checkout attempt per customer for 35 minutes. Repeated same-plan requests reuse its Stripe idempotency key and expiration; a different plan is refused until it expires, preventing two parallel tabs from creating duplicate subscriptions.

New checkout creates a Stripe customer from a verified authenticated account and stores that mapping before issuing a checkout session. Existing legacy links or exact-email Stripe matches stop new checkout and direct the user to support. This email check is conservative duplicate prevention, not account linking, and does not resolve changed/case-different legacy emails.

The portal and refresh routes accept no customer identity from the caller. Checkout verification checks both the trusted customer and authenticated reference, and never returns invoices. Paid entitlement requires an allowed price, active/trialing status, and an unexpired period. Scheduling cancellation preserves paid access through the period end. Past-due, unpaid, paused, incomplete, ended, and unknown-price subscriptions have no paid entitlement. Customer identity survives cancellation.

Webhooks reject invalid signatures with 400 and return 500 on processing failure so Stripe retries. They fetch current subscription state rather than trusting event order. The snapshot RPC atomically checks a revision, updates billing/profile state, and records the event ID. Concurrent fetches retry from a fresh revision and fresh Stripe state. Duplicate deliveries are harmless. Unmapped historical customers are acknowledged with a reconciliation log entry; mapping them requires the operator procedure above. Stripe and the database cannot provide an atomic cross-service transaction: a later Stripe change still requires its webhook or an authenticated refresh to synchronize.

## Local verification

The unit tests use fake external services; no test contacts Stripe or changes accounts. The separate SQL check executes the actual billing migration in PGlite with representative Supabase roles and profile RLS. It checks denied client billing writes/insert/delete, allowed profile edits, owner-only reads, transaction rollback, duplicate events, stale revisions, and permanent customer identity. It does not replace a full staging Supabase migration/reset.

```sh
npm test
npx tsc --noEmit
npm install --prefix /private/tmp/branded-billing-sql-test --no-package-lock --no-audit --no-fund @electric-sql/pglite@0.5.8
NODE_PATH=/private/tmp/branded-billing-sql-test/node_modules node scripts/test-billing-sql.cjs
```

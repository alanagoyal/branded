# branded.ai

The fastest way to name, brand, and domain your startup.

## Local setup

Use Node 22.13 or later, npm, and Docker if you want a local Supabase database.

```sh
npm ci
cp .env.example .env.local
npx supabase start
npx supabase db reset --local
npx supabase status
```

Copy the local API URL, anon key, and service-role key shown by Supabase into `.env.local`. This file is ignored by Git. Never put the service-role key or provider secrets in a `NEXT_PUBLIC_` variable. `db reset --local` deletes local database data; use it only for a disposable development database.

The checked-in migrations are the schema source of truth. The initial snapshot omits historical changes to Supabase-managed Auth tables; Supabase initializes those itself. Apply all migrations, not just the original 2024 snapshot. The billing security change captures the missing profile billing columns and introduces trusted billing ownership. Never import production customer/profile records as test fixtures or copy legacy client-writable billing IDs into trusted ownership records without reconciliation.

```sh
npm run dev
```

Open http://127.0.0.1:3000 (the configured local Auth URL). Set Supabase Auth's site URL and allowed redirects to the local URL when using a hosted development project. For local email sign-in, open the mail viewer URL printed by `npx supabase status`. Use a test account, not a production session.

## Feature configuration

`.env.example` lists public settings separately from server-only credentials. Missing provider keys mean the corresponding generation, lookup, billing, or support feature cannot be exercised. For builds that only check compilation, use inert placeholders as shown in `.github/workflows/ci.yml`; those are not working credentials.

- Names/logo/content generation: OpenAI and, for traced requests, Braintrust.
- Domain lookups: Whoxy. Trademark lookups: RapidAPI.
- PDF rendering runs locally with bundled fonts; no PDF-service credential is required.
- Support: [GitHub issues](https://github.com/alanagoyal/branded/issues). No support-provider credentials are required.
- Account deletion: Supabase service-role key plus Stripe access to check active billing.
- Billing: Stripe secret key, webhook signing secret, and `STRIPE_PRO_PRICE_ID` / `STRIPE_BUSINESS_PRICE_ID` recurring price IDs. Follow the [billing rollout](docs/billing-rollout.md) before enabling checkout.

For webhook development, use Stripe test mode and forward events:

```sh
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Set `STRIPE_ENDPOINT_SECRET` to the signing secret printed by that local listener. Do not reuse the production endpoint secret. Testing a webhook is separate from a successful build.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Pull requests and pushes to `main` run lint, TypeScript, unit tests, an isolated fresh-schema SQL check, and the production build. CI installs the lockfile with `npm ci`, does not auto-fix or commit files, and receives no production secrets. Existing lint warnings should be addressed independently; errors fail CI.

Database permission/usage tests supplied with the billing and access changes must also be run against a disposable local database before applying migrations. Never point migration tests at production. Docker/local database availability is required for full Supabase integration validation.

To run the same isolated PostgreSQL schema check as CI without Docker, install PGlite into a temporary directory (it is not an application dependency):

```sh
npm install --prefix /private/tmp/branded-schema-check --no-package-lock --ignore-scripts --no-audit --no-fund @electric-sql/pglite@0.5.8
NODE_PATH=/private/tmp/branded-schema-check/node_modules node scripts/test-schema-sql.cjs
```

This applies every checked-in application migration to a minimal Auth fixture and runs the access permission/usage assertions when present. It does not verify the real Supabase Auth migrations, REST API, or concurrent connections; also perform a full local/staging reset before release.

## Deployment order

Review each PR's migration and environment requirements. Apply schema migrations before code that depends on them, reconcile legacy billing mappings using verified provider evidence, then configure price IDs/webhook events and deploy. Verify authentication, billing portal ownership, quota exhaustion, private/shared records, and account deletion in staging before release. The PRs do not automatically rotate exposed credentials or apply production migrations.

The [provider access and sharing guide](docs/provider-access.md) explains authenticated free trials, durable limits, and intentional share links. Legacy raw-ID links are owner-only; public links must be created explicitly through Share.

See [credential incident follow-up](docs/credential-incident.md) for the remaining response to the removed environment endpoint.

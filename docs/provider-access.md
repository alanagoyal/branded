# Provider access and intentional sharing

## Deploy in order

1. Deploy the billing ownership PR and its `billing_accounts` migration. Populate existing customers through its verified reconciliation path. Client-editable legacy profile values never establish paid access.
2. Apply `20260921145601_usage_and_private_names.sql` with the project's normal migration process.
3. Deploy this application change with the server-only `SUPABASE_SERVICE_ROLE_KEY` configured.

Until the billing table or usage RPC is available, generation fails closed with 503. Missing billing rows receive free limits; a database error does not silently authorize a free attempt. This PR does not apply production migrations or make provider calls.

## Quotas

Every provider route requires a real authenticated account, including domain, trademark, npm, image and PDF endpoints. The former browser-only anonymous trial is removed; `/new` prompts visitors to sign in or create a free account.

Usage counts attempts per UTC calendar month. Reservations happen atomically before provider work; deleting saved results, failed responses and aborted requests do not refund usage. A user-wide row lock serializes concurrent requests across processes and features. An additional shared limit permits 20 provider operations per minute.

| Feature | Free | Pro | Business |
| --- | ---: | ---: | ---: |
| Name generation requests (up to 3 names each) | 10 | 100 | 500 |
| Domain lookup requests (6 TLDs each) | 5 | 50 | 250 |
| npm name suggestions | 5 | 50 | 250 |
| npm registry lookups | 15 | 150 | 750 |
| Logo requests | 1 | 5 | 50 |
| Trademark requests | 1 | 5 | 50 |
| One-pager text requests | 3 | 25 | 100 |
| One-pager PDF requests | 3 | 25 | 100 |

The initial migration starts fresh server usage counters; historical browser/saved-record counts are not authoritative and are not imported. The UI relies on server quota responses rather than rolling-month saved-record counts. Cached assets remain accessible without a new provider request or usage reservation. Server 401 responses offer sign-in, monthly 429 responses offer plan options, and rate-limit messages tell the user to wait. A generation request that filters for .com includes at most 10 WHOIS checks within its name-generation allowance. Only verified available names are returned; a shortage is reported explicitly.

Paid limits require a trusted active/trialing subscription with a future paid-period end. Scheduled cancellation keeps paid limits through that end. Invalid or oversized JSON is rejected before accounting; provider errors count as attempts. OpenAI output and retry counts, outbound lookup timeouts and fan-out are bounded. PDFs use the authenticated profile/email and load the owner's saved logo by name ID, not a caller-supplied image URL.

### Logo generation and persistence

The retired DALL-E model is replaced with `gpt-image-2.5-flare`: one 1024×1024, medium-quality JPEG with compression 80. The provider timeout is 120 seconds without retries; the route allows 180 seconds for generation and persistence. This uses the existing OpenAI key and installed SDK, with no new environment variables or dependencies. See the [official image guide](https://developers.openai.com/api/docs/guides/image-generation) for supported settings and pricing.

The server verifies name ownership, bounds the provider output to 1 MB, checks canonical base64 and JPEG frame dimensions (maximum 2048×2048), and saves a data URL in the existing `logos.logo_url` text column before returning success. This avoids expiring image links and introducing a new storage bucket. Images inherit existing owner-only RLS and name/account deletion cascades. No additional migration or storage cleanup is required. The client renders and downloads the saved JPEG directly. Expired legacy DALL-E links are replaced when the owner next requests a logo; replacement consumes a normal logo attempt.

PDF creation accepts a small POST body containing the owned name ID and content; image bytes never travel in the URL. Because logo rows remain owner-editable, PDF loading revalidates the JPEG's encoded size, MIME prefix, magic bytes, and dimensions, and rejects SVG/HTML. Legacy Azure image links remain supported with redirects disabled and a 5 MB fetch cap. Expired legacy images are omitted from the PDF.

## Data access and sharing

Names and npm records are owner-only. npm writes must also reference a name owned by the caller. Anonymous enumeration/inserts and cross-owner updates/deletes are denied by database grants and RLS.

An owner explicitly clicks **Create share link** to publish up to 20 selected names. The server verifies every ID and issues an unguessable token. Anyone with that token can read only the selected names and descriptions on `/share/<token>`; tokens and underlying rows cannot be listed through the public Data API. Shared pages are marked noindex/nofollow and no-referrer.

Legacy raw-ID links now work only for the owner. Owners can recreate public links through Share. The read-only shared page does not publish billing, account, ownership, generation options, logos, PDFs, domains or trademark records. Deleting a shared name removes it from the public page; deleting the account removes its shares. There is no separate revoke-link control in this change.

## Verification

- `npm test`: mocked-service tests exercise route authentication, validation, fail-closed billing/usage errors, quotas, domain shortages, sharing ownership and PDF URL protection without paid calls.
- `npx tsc --noEmit` and `npm run lint`.
- `supabase/tests/provider-access.sql`: run in a disposable local database after the migration, inside a transaction and roll it back. It creates fixture users, asserts RLS/grants and quota behavior, and must never run against production. The migration and assertions were also executed successfully in an isolated PGlite PostgreSQL instance; this verifies SQL behavior but not multi-connection contention.
- Local HTTP smoke checks verify provider endpoints and share creation return 401 without a session, and `/new` displays its sign-in prompt. A single real logo-provider request with the configured model/settings returned a valid 47,499-byte JPEG in 10.4 seconds; the image was visually checked. Database ownership/persistence and PDF rendering are tested with mocks, not production writes.

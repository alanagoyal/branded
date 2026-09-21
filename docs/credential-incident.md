# Environment endpoint incident follow-up

## Confirmed scope

Commit `2d52e3f85df2546aeba15b8d179d846cba9b3640`, dated May 21, 2026, added an unauthenticated `/_build_info` response containing `process.env`. The prior investigation confirmed a live response with 89 keys without printing or retaining values. PR #57 removed the endpoint and was deployed September 21, 2026. Removal prevents that disclosure path; it does not invalidate previously exposed credentials.

Git attributes the unsigned commit to `alanagoyal`. That attribution does not establish which person/tool authored or deployed it, intent, deployment timing, or whether a third party accessed it.

## Operator actions still required

1. Preserve hosting access/deployment logs and provider audit logs before retention expires. Search for the endpoint, unusual API usage, changed webhooks/keys, and unexpected authentication or database access. Record the first deployment containing the commit and the deployment that removed it.
2. Inventory secrets present in the affected deployment using the hosting provider's settings, without copying their values into an issue, log, or document. Include Supabase service-role/secret keys and legacy JWT-signing implications, Stripe API/webhook secrets, OpenAI, Braintrust, OneDoc, Whoxy, RapidAPI, and any hosting/CI or database credentials actually present. Public browser keys are not interchangeable with server secrets.
3. Rotate/revoke each applicable exposed credential in its owning provider, update every consumer and hosting environment, redeploy, and verify the old credential is rejected. Use the provider's documented overlap procedure where available. Changing a legacy Supabase JWT signing secret can affect existing sessions and anon/service-role keys; plan that migration explicitly.
4. Reconcile provider usage and billing for the exposure interval. Review Supabase access/RLS and auth events, Stripe API actions/portal sessions, generation provider requests, and hosting administration activity. Escalate confirmed unauthorized activity through the provider's incident process.
5. Record completion using provider/key identifiers and timestamps only. Do not paste credentials or the former endpoint's contents. Preserve uncertainty where logs do not cover the full interval.

## Status

This change documents the handoff. It does not claim that credentials were rotated, access logs were reviewed, or the incident was closed. Code PRs and passing tests cannot establish those facts.

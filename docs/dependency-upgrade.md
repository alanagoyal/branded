# Dependency security update

## Runtime and compatibility

Use Node 22.13 or later (`nvm use`). This update retains React 18 and moves Next.js to the patched 15.5 maintenance line. Next.js request cookies, headers, route parameters, and search parameters are now awaited. The Supabase SSR adapters use the supported batch cookie API and preserve refresh cache headers.

The lockfile refresh stays within existing direct dependency ranges except for the explicitly pinned Next.js/ESLint integration, Supabase clients/CLI, and Braintrust SDK. Unused Million packages are removed. The deprecated `uuidv4` wrapper is replaced by a direct `uuid` dependency, which the application already imports. Braintrust's existing tracing and OpenAI wrapper APIs are retained.

Two targeted compatible transitive overrides are intentional:

- Next.js's pinned PostCSS 8.4 is replaced with patched PostCSS 8.5.28.
- Refractor's pinned Prism 1.27 is replaced with patched Prism 1.30.0.

Keep these overrides until upstream dependencies use patched versions. Do not remove them just to reduce package.json size.

## Audit scope

On September 21, 2026, the base lockfile produced 125 production audit entries (7 critical, 31 high, 85 moderate, 2 low). The document's earlier count was a different audit snapshot. After this change, both `npm audit --omit=dev` and `npm audit` report zero known findings. This is a registry advisory snapshot, not proof that the application or every dependency is vulnerability-free.

The original `simple-git` issue came through the unused Million tooling dependency. `form-data` was transitive. Both disappear or resolve to patched versions in the updated dependency tree. Next.js advisories differ in applicability: this app uses App Router and image optimization, while a Windows-only advisory does not apply to the current macOS/Linux checks. Updating avoids relying on that distinction for safety.

## Verification

Run `npm ci`, `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm audit` with Node 22. Cookie regression tests check asynchronous request access, multi-cookie refresh, read-only server rendering, and no-cache response headers.

Provider calls require test credentials and should be checked in staging before release. Local checks do not exercise live Stripe charges, AI generation, or authenticated production sessions. Configure the hosting runtime for Node 22 before deploying this branch.

References: [Next.js August 2026 security release](https://nextjs.org/blog/august-2026-security-release), [Next.js 15 migration guide](https://nextjs.org/docs/app/guides/upgrading/version-15), [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

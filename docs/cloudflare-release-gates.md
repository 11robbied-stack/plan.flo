# Self-contained GitHub → staging release gates

These are proposed settings for the existing `planflo-staging` build trigger. Apply them only after this follow-up commit is reviewed and published; no settings, tokens or permissions are changed by these scripts. Keep repository `11robbied-stack/plan.flo`, branch `review/customer-auth-isolation`, root `/`, disabled previews and existing deployment credentials. Do not use this staging gate for main/www.

## Build variables (non-secret)

```text
NODE_VERSION=24.19.0
PNPM_VERSION=11.25.0
SKIP_DEPENDENCY_INSTALL=1
CLOUDFLARE_CF_FETCH_ENABLED=false
WRANGLER_SEND_METRICS=false
PLAYWRIGHT_BROWSERS_PATH=.sites-runtime/playwright
PLANFLO_STAGING_SCHEMA_TREE=fdb253adc647209dc37ca12f39055bfb4082e0d7
```

Do not set `NODE_ENV=production` for dependency installation: release checks need dev dependencies. Do not set the Mac-specific `PLANFLO_PLAYWRIGHT_MODULE` or `PLANFLO_CHROME_PATH`; the pinned `playwright@1.62.1` dependency resolves normally and launches its matching Chromium. Do not enable `PLANFLO_HEADED` in CI. Cloudflare supplies `WORKERS_CI=1`, `WORKERS_CI_COMMIT_SHA` and `WORKERS_CI_BRANCH`; do not override these.

## Exact build command

```sh
node scripts/check-release-gate.mjs && pnpm install --frozen-lockfile && pnpm exec playwright install --with-deps chromium && pnpm release:prepare
```

## Exact deploy command

```sh
pnpm release:gate && pnpm release:verify && pnpm exec wrangler deploy --config staging/wrangler.staging.json --keep-vars
```

The gate runs before installation and again around preparation and deployment. It compares the triggering commit with clean Git HEAD, restricts the source branch and compares the committed `drizzle` tree with the separately approved tree. Preparation runs migration integrity/upgrade tests, TypeScript, security/auth, mail, invoice, PO, PDF and browser tests. It builds once, exercises those artifacts and records their hashes and schema tree in `dist/release-manifest.json`. Verification rejects a different commit, dirty source, changed schema or modified/missing/extra deployment artifacts. Wrangler deploys these outputs without a second build (`no_bundle` is configured).

Do not replace a failed gate with plain `pnpm build`, skip browser tests, enable previews sharing staging data or add database credentials to the builder. Preserve the existing runtime secrets, bindings, custom domain, preview settings and mail Worker. This changes only the existing application's build/deploy commands and the listed non-secret build variables after approval.

## Migration approval without database grants

The initial approved tree above is the exact migration directory through 0027. That migration was applied to staging and independently read back at 2026-10-03 10:14:43 UTC before the v58 publication. That historical approval does not cover the newer 0028 Xero migration. The latest candidate must remain blocked until 0028 is separately applied and read back, then its exact committed schema tree is approved. Turnstile runtime configuration must also be verified before publishing the signup changes.

Any migration addition, deletion or edit (including journal/snapshot metadata) changes `HEAD:drizzle` and stops automatic deployment. Leave the approval variable unchanged until an authorized operator has separately reviewed the SQL, verified the correct database and recovery point, applied the approved migration and read back the ledger/schema. Then update only `PLANFLO_STAGING_SCHEMA_TREE` to the reviewed commit's `git rev-parse <commit>:drizzle` value and retry that exact candidate's build. A missing variable fails closed. Never automatically derive and approve the variable from the build being deployed.

This deliberately needs no additional D1 grant, token, runtime endpoint or persistent credential. It cannot discover live database drift or prove that an operator actually applied SQL: the externally maintained approval value attests to the manual readback. Keep access to build settings controlled. A person who can replace build commands/source gates can bypass them; this is a deployment safeguard, not a separate authorization system.

## Installation and runtime limits

Cloudflare's documented builder is Ubuntu 24.04/x86_64 and supports explicit Node/pnpm versions and skipping its automatic dependency install. Node 24 is used for built-in SQLite and matches local testing. Clean clones select the existing portable build profile; do not copy `.sites-runtime/execution-profile.json` from another environment.

The lockfile retains the existing seven-day dependency maturity/strict build policy. Chromium and its Linux libraries are installed during the build; this needs browser-download access and permission to install system packages. Miniflare/workerd and Chromium also need subprocess/loopback support. This exact browser/system-library setup has not yet been exercised in the Cloudflare builder. First run it as a staging canary and inspect the full log; installer/launch/test failures must stop deployment. No new Cloudflare grant is needed for local browser tests. Do not request account-level Browser Run access: these tests use local Chromium, not that service.

If the builder cannot install/run Chromium, retain the failing gate and coordinate a supported CI runner or approved image solution. Do not silently downgrade to a build-only deployment. The local and cloud builds can differ at the byte level; each environment's manifest verifies the artifacts actually tested there.

On macOS, the self-contained local setup is `pnpm install --frozen-lockfile`, `pnpm browser:install`, then `pnpm release:prepare` on a clean committed tree. Linux uses `pnpm exec playwright install --with-deps chromium`. When setting `PLAYWRIGHT_BROWSERS_PATH`, use the same value for installation and preparation.

After successful deployment, inspect the provider's full source SHA/version and confirm that `/api/version` and the sidebar match its short commit ID without `-dirty`. Retain the previous version for code rollback. Database rollback remains separate and must never be inferred from code rollback.

References: [Cloudflare build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/), [Playwright CI requirements](https://playwright.dev/docs/ci).

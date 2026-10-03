# Approved staging deployment configuration

The parent browser task verified `https://staging.planflo.app` serves login and unauthenticated `/api/data` returns 401. The owner entered the two runtime secrets. These are parent-reported live observations; this configuration change performs no remote writes. Coordinate the next push/deploy with the parent because signup is in progress.

`staging/wrangler.staging.json` now declares exactly one Custom Domain:

```json
{"pattern":"staging.planflo.app","custom_domain":true,"zone_name":"planflo.app","enabled":true,"previews_enabled":false}
```

The app origin is `https://staging.planflo.app`. `workers_dev` and preview URLs remain disabled. D1 UUID, private R2 and private `AUTH_EMAIL` binding are unchanged. The mail config records the same origin and the user-selected sender `no-reply@notifications.planflo.app`; its routes remain empty and logging disabled. Its compatibility date matches the dashboard's 2026-10-03, already tested using the exact bundle and an isolated workerd 1.20261003.1 runtime.

The existing deploy command with `--var PLANFLO_AUTH_ORIGIN:https://staging.planflo.app` remains valid; the override is now redundant because the checked-in config agrees. Use the explicit `--config staging/wrangler.staging.json`. Do not deploy the generated `dist/server/wrangler.json` or the older private-only example/local config.

## Secret preservation

No secret values, empty secret placeholders or privileged account pins are included in either config. Do not use `--secrets-file`, secret bulk/delete commands, or plaintext `--var` overrides for these names during this deployment. Wrangler 4.92.0's deploy implementation sets `keepSecrets: true` and retains `secret_text`/`secret_key` bindings; normal code deployment preserves unchanged encrypted secrets. The local `staging:check` rejects these names in plaintext `vars` even if empty. A dry run cannot inspect live secret contents; verify binding names/presence through the supported dashboard without revealing their values.

- App Worker only: encrypted `BETTER_AUTH_SECRET`.
- Mail Worker only: encrypted `RESEND_API_KEY`.
- Later, only after explicit authorization: put both platform-owner pins below on the app as encrypted runtime secrets too, so they survive future deployments. They are identifiers, not passwords, but encrypted bindings avoid accidental removal of dashboard-only plaintext values. Do not rotate the existing auth secret while Rob is signing up.

## Rob's platform-owner setup after signup

No platform-owner pin is required to sign up, verify email, log in or create a company. Company ownership and platform administration are separate. Do not promote the first account, infer identity from a name, copy a legacy Sites user ID, or grant access solely because an email matches.

1. Rob completes his own signup, receives/consumes verification and signs in at the exact staging origin. Normal business onboarding creates his company; an invitation acceptance is not platform bootstrap.
2. In Rob's supported authenticated browser context, read `/api/auth/get-session`. Extract **only** `user.id`, `user.email`, and `user.emailVerified`; do not copy session objects, cookies, tokens or a full response into chat/logs. Require `emailVerified === true`. Establish that this is Rob's account with Rob directly, not merely an account with an expected email string.
3. Corroborate that exact raw `user.id` in staging D1 `auth_user`, selecting only `id`, `email`, `email_verified`; require the same email and `email_verified=1`. Use an exact bound ID lookup where supported. No auth-table updates or manual verification flags.
4. After the parent/user approves this concrete ID/email pair, configure on **planflo-staging**:
   - `PLANFLO_PLATFORM_OWNER_ID=auth:<exact raw auth_user.id>` (one `auth:` prefix)
   - `PLANFLO_PLATFORM_OWNER_EMAIL=<that account's verified email>`
   Use encrypted runtime secrets in the dashboard to preserve them on later code deployments. Do not put them on the mail Worker or in company settings. No pins are assigned by this change.
5. Confirm Rob's authenticated platform admin access after the configuration deployment; confirm another company owner's account remains denied. Anonymous access must remain denied. If either pin is missing/wrong, administration must stay unavailable. For a later separate production database, identify and approve the production account independently; do not assume staging IDs transfer.

Implementation evidence: `app/chatgpt-auth.ts` returns only verified Better Auth identities as `auth:<id>`; `app/platform-owner.ts` requires the exact subject and normalized verified email together. Existing security tests cover mismatched subject/email and denied tenant-owner escalation.

References:
- [Cloudflare Custom Domain configuration](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare secret preservation](https://developers.cloudflare.com/workers/configuration/secrets/)

## Local reconciliation after the paused direct deployment

The first direct deploy was canceled at the configuration-difference prompt, before upload. The temporary OAuth grant was logged out. No retry or new login was performed to prepare this reconciliation.

The tracked config now explicitly retains every displayed remote route/service value: `zone_name: "planflo.app"`, `enabled: true`, `previews_enabled: false`, and `AUTH_EMAIL.environment: "production"`. Here `production` is Cloudflare's environment name within the existing **planflo-staging-mail** Worker, not a different PLAN.FLO production system. The exact D1 UUID and private R2 bucket remain unchanged. The staging check now enforces these values and the exact approved D1 UUID.

Wrangler 4.92.0's runtime configuration validator accepts these fields, its remote-to-local converter emits this route shape, and its upload metadata preserves the service environment. Its shipped editor JSON schema is incomplete: it omits service `environment` and does not allow zone name alongside custom-domain flags in one schema alternative. Do not remove the explicit preservation values to silence that editor-only discrepancy. The actual `unstable_readConfig` normalized result was asserted against the complete route and service objects; the real deploy dry run passed without configuration warnings.

Relative to the previously displayed remote diff, only adding the tested app's static assets and local D1 name/migration-directory metadata should remain. The latter are CLI metadata, not a migration operation. A fresh authorized remote comparison must still confirm there are no other changes; do not bypass a new conflict or the previous approval-review rejection. Any remaining confirmation should explicitly approve publishing the tested app/assets and email code while retaining the current domain, previews setting, mail target, database, file bucket and secrets. No database migrations or customer-account writes are included.

# PLAN.FLO authentication email

This internal Worker implements the existing `AUTH_EMAIL.fetch()` contract for verification and password recovery. It uses Resend's HTTPS API without an SDK dependency. The parent now reports private mail deployment and owner-entered runtime secrets. This repository contains no credentials; local tests use synthetic delivery only. See `staging/DEPLOYMENT.md` for the current staging and owner-identity handoff.

The app sends `POST https://mail.internal/send` with JSON `{to, purpose, url}`. Only `verification` and `recovery` are accepted. The Worker validates one recipient, an exact HTTPS application origin, the corresponding Better Auth path/token, and same-origin callbacks. It supplies its own sender, subject and plaintext content. Requests are limited to 8 KiB, links to 4 KiB and provider responses to 4 KiB. Caller-supplied templates, sender addresses and provider endpoints are not accepted.

The security boundary is the Cloudflare service binding: the mail Worker must have `workers_dev: false`, `preview_urls: false` and no routes/custom domains. The `mail.internal` URL is a routing contract, not an authentication secret. Do not expose this Worker publicly. Only the application Worker should have its binding. User-facing auth endpoints already apply origin checks and database-backed rate limits. This Worker has no database or application/session secret.

The provider adapter sends to fixed `https://api.resend.com/emails`, refuses redirects and returns 204 only for a successful provider response containing an email ID. That means **provider acceptance**, not confirmed inbox delivery. Network errors, timeouts, 429, 5xx and concurrent idempotency conflicts receive at most three attempts, each with a five-second timeout. Retries use a SHA-256 digest of the exact provider payload as an opaque idempotency key and bounded backoff. Provider `Retry-After` above two seconds ends this request with 503 instead of retrying prematurely. Permanent errors, invalid responses and exhausted retries also return an empty 503. There is no background queue or durable retry after the request ends; the app must show its existing failure/retry flow. Resend retains idempotency keys for 24 hours.

There are no application logs of recipients, URLs, tokens, payloads, keys or provider errors. Worker observability is disabled in the deployment config. Resend necessarily receives the recipient and token link to send the message; account access and retention need to be appropriate for authentication mail. Disable provider open/click tracking for authentication messages; links should remain direct.

## Required setup after approval

1. Approve an existing Resend account, or create/connect one separately with permission. Verify an owned sending domain using the exact DNS records Resend supplies; do not guess SPF/DKIM values or overwrite unrelated records.
2. Choose a sender on that verified domain, for example `no-reply@notifications.planflo.app` **only after verification and approval**. Set `AUTH_EMAIL_FROM` to the bare mailbox; the code adds `PLAN.FLO` as the display name. `AUTH_EMAIL_PROVIDER` is `resend`.
3. Create a least-privilege Resend key with **Sending access**, restricted to that sending domain. Supply it only as Worker secret `RESEND_API_KEY` on `planflo-staging-mail`. Never put it in the app, repository, browser or chat.
4. Replace `PLANFLO_AUTH_ORIGIN` in both staging configs with the same approved exact HTTPS origin, without a trailing slash. Supply the app's separate random 32+ character `BETTER_AUTH_SECRET` through approved secret management. These two secrets are not interchangeable.
5. After deployment approval, deploy `workers/auth-email/wrangler.staging.jsonc` with public ingress still disabled. Bind app `AUTH_EMAIL` to `planflo-staging-mail` (already specified in `staging/wrangler.staging.json`). Deploy the approved review commit, with verified staging D1 migrations and private R2, not main.
6. With approved test recipients, verify real signup email, link consumption, recovery email, expired/reused links, retry/error UX and sessions revoked after reset. Inspect provider delivery/bounce status without copying tokens. No real delivery claim is justified until these checks pass.

The isolated `sendResend` adapter can be replaced by another approved provider while keeping validation and message templates unchanged. Selecting an unknown provider fails closed; there is no arbitrary URL configuration.

## Verification

`npm run test:email` runs synthetic unit tests and local workerd integration through an actual service binding. All provider requests are stubbed. `npm run test:security` exercises existing auth/company isolation handlers. These do not provision resources or send real mail.

Official references checked during implementation:
- [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend idempotency and retry conflict semantics](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Resend API key permissions](https://resend.com/docs/dashboard/api-keys/introduction)
- [Cloudflare service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)

## Minimal approved staging deployment sequence

The browser coordinator owns provider signup/DNS and secret entry. In the mail Worker's Settings → Variables and Secrets, enter the Resend key as encrypted secret `RESEND_API_KEY`; enter no key in a plain variable. In the app Worker's corresponding screen, enter its independently generated secret `BETTER_AUTH_SECRET`. If either Worker does not exist yet, deploy its code privately first after approval, then add its secret; authentication fails closed until setup finishes. Do not send an actual test message during provisioning.

Use these repository-root commands only after deployment authorization and an authorized Wrangler login (the last read-only check reported logged out):

```sh
pnpm exec wrangler deploy --config workers/auth-email/wrangler.staging.jsonc
pnpm build
pnpm exec wrangler deploy --config staging/wrangler.staging.json
```

Before app deployment, finish the isolated D1 bootstrap and record/verify its ledger using `staging/bootstrap/HANDOFF.txt`; replace the exact staging origin in both configs and verified sender in the mail config. `pnpm staging:check` validates the approved app custom domain and private mail configuration. The app config now preserves `staging.planflo.app`; the mail Worker remains private. Never add public routing to the mail Worker. The user can enter secrets through Cloudflare's supported dashboard instead of granting this terminal persistent credentials.

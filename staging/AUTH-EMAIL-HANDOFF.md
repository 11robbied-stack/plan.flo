# Branded account-flow deployment handoff

The app now uses its existing PLAN.FLO WelcomeScreen branding throughout customer authentication. Signup and recovery responses lead to `/check-email`; generic responses do not assert that an account was created or mail delivered. Verification is still required before login. The page offers resend, a 30-second convenience cooldown, rate-limit/network feedback, change-email and back-to-sign-in actions. Server-side limits remain authoritative. Only the email address, purpose and timestamp are temporarily held in session storage (15-minute read lifetime); no password is stored there and email addresses are not put in navigation URLs. Invitation return paths remain restricted to the local origin.

The private mail Worker now sends matching HTML and plaintext verification/recovery emails. The existing icon is rasterized as `public/planflo-email-icon.png`; its absolute URL is derived only from the validated configured auth origin. Live text branding remains when remote images are blocked. The displayed 60-minute expiry and both server token lifetimes use `shared/auth-policy.mjs`.

## Coordinated rollout

1. Push this review branch through the already authorized GitHub Desktop workflow. It includes route-preservation commit `79398192e1619ed4ff30a8aba5c44b66d394190e`.
2. Build/deploy the app using **`staging/wrangler.staging.json`**, preserving existing encrypted secrets and bindings as described in `DEPLOYMENT.md`. This publishes the new screens and logo asset. No schema migration is needed.
3. Update **planflo-staging-mail** with the newly bundled mail code. Deploy the checked-in `workers/auth-email/wrangler.staging.jsonc`, or use the prepared single-module dashboard bundle below. Keep public routes, workers.dev, previews and observability disabled; retain its encrypted `RESEND_API_KEY`, exact auth origin and existing sender. Do not paste the unbundled source with its relative import into the dashboard.
4. Read-only checks after rollout: login/check-email render, logo returns an image, anonymous `/api/data` remains 401. Coordinate any real resend/verification/login with Rob; do not consume the real link from the reference screenshot. Actual delivered-email rendering and Rob's successful verification/login remain unverified by this local work.

Prepared local artifact (ignored by git): `test-audit/deploy-handoff/mail-v2/worker.js`.
SHA-256: `2a590ed6f9ca7d24fb7fa5f54d5417165128bc3f0cbe7fa6acd211c0387fd4e1`.
Rebuild rather than reuse this hash if source changes. The bundle has no secrets and no source-map reference. Its exact bytes passed the service-binding integration test with workerd 1.20261003.1 and compatibility date 2026-10-03.

## Evidence

- 225 security checks pass: real Better Auth sessions and token flows, recovery, invitations, role enforcement and company isolation; all external mail transport synthetic.
- 74 headed Chrome acceptance checks pass against disposable local D1/R2. These include mobile signup/check-email/login, repeated-submit protection, generic success, resend cooldown/429/network failure, invalid links, and back during an in-flight resend. Network/429 UI branches deliberately use synthetic responses; security checks independently cover server rate limits and expired tokens.
- 40 mail tests pass, plus the exact October-runtime bundle test. Includes HTML link escaping, approved-origin logo, plaintext fallback, provider failure/retry and private configuration.
- Application typecheck, production build, staging config check and mail deploy dry-run pass. Changed auth/email lint has no errors (one navigation recommendation). Existing WelcomeScreen link lint is unchanged.
- Mobile and desktop synthetic email screenshots: `test-audit/email-preview/`. UI screenshots: `test-audit/browser-artifacts/mobile-{signup,check-email,login}.png`.

No live deployment, provider settings change, real email send or account mutation was performed during this implementation. Browser rendering is not a substitute for testing in every email client.

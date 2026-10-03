# PLAN.FLO launch checkpoint — 3 October 2026

**Local application checks pass. Independent customer production launch is not yet verified or ready to approve.** GitHub write authentication, confirmed staging resources and real email delivery remain blockers. No production settings, records, secrets, deployments, paid services or provider accounts were changed.

## Observed locally

- Saved implementation commit `6dc1c3b758979a76bc45289a8af41c72c9e9bb6a` was clean at resumption. The follow-up replaces the unreliable native PDF embed with PDF.js canvas rendering; see the PDF fix below.
- Existing 206 security/handler tests pass again; type check and production build pass again.
- Added 54 passing browser/Worker checks (both headless and headed Chrome) using the installed Chrome in its own headless process, local Miniflare/workerd, fresh disposable D1/R2 and an in-memory email service. No user browser profile, Safari session, production data or provider credentials were used. External HTTP requests were blocked.
- UI-driven checks: signup, email verification, sign-in, company creation, project creation, invitation continuation through signup and acceptance, password recovery and new-password login, visible account/logout flow, and core screen navigation.
- Authenticated browser requests: tasks with drawings, schedule shifts, timesheets, RFIs and draft variations save/reload; PDF upload, exact-byte download and revision history work. These saves were not all manually entered through each feature's form.
- Two synthetic companies remain isolated; guessed other-company file IDs return 404. Staff default to no projects, receive exactly the assigned project, cannot promote themselves or access platform administration, and lose access immediately when disabled. A separately pinned synthetic Rob identity can access platform administration; company owners cannot.
- PDF primary preview and comparison now render through PDF.js. Visual inspection and pixel tests pass for the primary preview, page navigation, original/revised files, page-specific markups, explicit download, corrupt-file errors and recovery. Native embedding remained blank under automation, including a local response diagnostic without CSP; the exact native-plugin cause remains unconfirmed. No server security headers or authorization checks were weakened.
- No browser JavaScript exceptions. New browser test runner lint passes. Existing application lint debt is unchanged from the previous review.

Evidence: `test-audit/BROWSER-RESULTS.json`, `test-audit/RESULTS.json`. Local ignored screenshots include `test-audit/browser-artifacts/rendered-pdf.png`, `pdf-comparison.png`, and `drawing-preview.png`.

## Concrete launch blockers and the smallest next steps

| Blocker | Required action and approval boundary |
| --- | --- |
| Review branch cannot be pushed | Terminal Git still lacks credentials. The separate browser task has verified GitHub Desktop signed in as 11robbied-stack; it must add this isolated review checkout and publish only review/customer-auth-isolation. Its currently open DIFFERENT checkout is on main with four local commits: do not push that main. Fresh fetch confirms remote main 2fa2b4e is an ancestor of this review branch; no .github workflows are present. |
| Current Cloudflare state not freshly verified | The parent reports a fresh Safari inspection: plan-flo has no bindings, vars, routes or enabled workers.dev URL; no D1 exists. Its latest build failed on placeholder DB id (10181). R2 is active with empty site-creator-r2. Preview branch builds remain off. Approve isolated staging rather than changing production placeholders in place. |
| Isolated runnable staging absent | Confirm/approve a separate Worker `planflo-staging`, D1 `planflo-staging-db` bound as `DB`, and R2 `planflo-staging-files` bound as `FILES`. Verify actual account/resource IDs before any migration. R2 activation, provisioning, spend and deployment each remain approval-bound. |
| No approved reachable staging URL | Select the exact staging hostname and approve access/routing. The template intentionally disables workers.dev, previews and routes; it is not an online configuration. Set the exact HTTPS origin in `PLANFLO_AUTH_ORIGIN`; never point staging at production storage. |
| Email service not implemented/configured for live delivery | Choose an existing authorized mail provider and verified sender/domain. Implement its internal `AUTH_EMAIL` service adapter, including acceptance/queueing, retries and delivery monitoring. Verify signup/recovery delivery to an authorized test inbox. No public test mailbox or verification bypass may substitute. Provider signup, API grants/secrets, domain/DNS verification and paid usage require approval. |
| Authentication secret absent | Approve secure configuration of a random `BETTER_AUTH_SECRET` of at least 32 characters. Keep it outside source/logs. Standalone authentication fails closed without required configuration. |
| Rob platform identity absent | After Rob's customer account is verified, approve pinning both `PLANFLO_PLATFORM_OWNER_ID=auth:<actual-id>` and his verified email. No first-user promotion or automatic linking to Sites ownership. |
| Deployed acceptance and cutover not completed | Apply migrations only to confirmed staging, run two-company acceptance and real email tests, check canvas preview/download on desktop and mobile, inspect logs/limits, and review destination, backup, rollback and any explicit old-account ownership mapping. Only then review a production deployment. |

No purchase or custom domain is inherently required to perform a separately approved Worker-hostname staging test. This is not confirmation of account entitlements or free-tier capacity. Existing beta can remain untouched while staging is completed.

## Reproduce the browser run

Build first. `pnpm test:browser` uses Playwright from the existing environment (or an explicitly supplied `PLANFLO_PLAYWRIGHT_MODULE`) and Chrome from `PLANFLO_CHROME_PATH`; it does not install either. It binds only `127.0.0.1:5201`, creates synthetic fixtures, and disposes the browser and Worker afterward. `pnpm test:security` reruns the independent 206-check harness.

The afternoon target depends on resolving the above external blockers and passing deployed acceptance. Local results do not support claiming that live customer signup or mail is working yet.

## PDF preview fix

`app/drawing-pdf.tsx` loads the same authenticated file endpoint using the already-installed PDF.js package and worker. It renders a selected page to canvas with loading and error states. Page controls reset on drawing/revision changes. New markups include their page; older markups without a page stay on page one. An explicit same-origin download link preserves the original bytes. Existing company/project/revision authorization and response security headers are unchanged. Build/type check, all 206 security checks and 54 browser checks pass. New-file lint is clean; workspace lint remains at its baseline 30 errors / 25 warnings.

## Exact isolated staging approval bundle

1. Create Worker `planflo-staging`, D1 database `planflo-staging-db` (binding `DB`) and R2 bucket `planflo-staging-files` (binding `FILES`) in the reviewed account. Do not reuse the empty `site-creator-r2` or placeholder DB configuration accidentally. Actual database ID must be copied from the created resource and independently verified. Review charges/entitlements before activation; no paid service is authorized by this document.
2. Select and approve a reachable staging hostname. Candidate inferred from the existing account subdomain: `https://planflo-staging.11robbied.workers.dev`; verify availability before use. Enable workers.dev only for this staging Worker if approved. Keep production routes/main settings and preview-branch builds unchanged.
3. Set staging variables `PLANFLO_AUTH_MODE=standalone`, `PLANFLO_DEPLOYMENT=staging`, and `PLANFLO_AUTH_ORIGIN=<exact approved HTTPS origin>`. Approve creation of a random secret in `BETTER_AUTH_SECRET`; never commit its value. Do not enable the managed-sites identity adapter on this Worker.
4. Create an internal mail Worker `planflo-staging-mail`, bound to the app as `AUTH_EMAIL`. Current app contract is POST `{to,purpose,url}` with success only after accepted delivery/queueing. A real provider adapter, retry mechanism and sender configuration still need implementation after provider selection. No public mock mailbox or verification bypass is acceptable.
5. Email choices: reuse an existing authorized provider with a verified sender (smallest setup); otherwise review a new Resend or Postmark account/verified sender and approve its credentials/domain steps before implementing that adapter. Neither provider is configured. Reference APIs: https://resend.com/docs/api-reference/emails/send-email and https://postmarkapp.com/developer/api/email-api . Test real delivery only to approved recipients.
6. Approve applying all migrations to the confirmed empty staging D1, including 0024 project assignments and 0025 customer auth. Test synthetic companies first. No production migration or old-account linking is included.
7. Rob completes verified signup in staging; then approve pinning `PLANFLO_PLATFORM_OWNER_ID=auth:<actual user id>` and `PLANFLO_PLATFORM_OWNER_EMAIL=<verified email>`. Keep platform administration closed until both match.
8. Approve staging deployment and its access scope, then run real-mail/browser/isolation acceptance on that exact URL. Production cutover remains a separate reviewed action.

## Database correction handoff

Rob's later “fix it” instruction authorizes the isolated database correction; it does not authorize new secrets/grants, paid-plan upgrades or production cutover. Browser owner should create/verify `planflo-staging-db` and report its actual UUID. Create/verify `planflo-staging-files` separately. Keep `plan-flo` and its old main build unchanged.

After confirming the new database is empty and isolated, copy the reviewed staging template to ignored `wrangler.staging.json`, replace the DB UUID and approved staging origin, and validate with `pnpm staging:check`. Configure the mail binding only once that service exists. The ordered schema operation for a NEW empty database is:

```sh
pnpm exec wrangler d1 migrations apply DB --config wrangler.staging.json --remote
```

This applies every migration in `drizzle/` from `0000` through `0025`; do not apply only the last two to an empty database. Before running it, use a read-only database info/list check to confirm account, name, UUID and binding point exclusively to staging. Afterward verify migrations applied and expected auth/company/project tables exist; no production migration is part of this command's authorization.

Build source from `review/customer-auth-isolation`, not the different Desktop checkout's main branch. A deployment is a later separately reviewed step, not a side effect of creating the DB or applying this schema. If email/origin/secret configuration remains missing, the app deliberately refuses independent authentication; successful build/database setup alone is not launch acceptance.

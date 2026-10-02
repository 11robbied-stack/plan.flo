# PLAN.FLO launch checkpoint — 3 October 2026

**Local application checks pass. Independent customer production launch is not yet verified or ready to approve.** GitHub write authentication, confirmed staging resources and real email delivery remain blockers. No production settings, records, secrets, deployments, paid services or provider accounts were changed.

## Observed locally

- Saved implementation commit `6dc1c3b758979a76bc45289a8af41c72c9e9bb6a` was clean at resumption. No application defect requiring a source change was confirmed in this pass.
- Existing 206 security/handler tests pass again; type check and production build pass again.
- Added 46 passing browser/Worker checks using the installed Chrome in its own headless process, local Miniflare/workerd, fresh disposable D1/R2 and an in-memory email service. No user browser profile, Safari session, production data or provider credentials were used. External HTTP requests were blocked.
- UI-driven checks: signup, email verification, sign-in, company creation, project creation, invitation continuation through signup and acceptance, password recovery and new-password login, visible account/logout flow, and core screen navigation.
- Authenticated browser requests: tasks with drawings, schedule shifts, timesheets, RFIs and draft variations save/reload; PDF upload, exact-byte download and revision history work. These saves were not all manually entered through each feature's form.
- Two synthetic companies remain isolated; guessed other-company file IDs return 404. Staff default to no projects, receive exactly the assigned project, cannot promote themselves or access platform administration, and lose access immediately when disabled. A separately pinned synthetic Rob identity can access platform administration; company owners cannot.
- PDF comparison/overlay rendered a synthetic PDF's text into canvas, verified by nonwhite pixel checks and visual inspection. Native embedded PDF preview remained dark in headless Chrome screenshots, including a diagnostic that removed CSP only from one intercepted local response. That did not establish an application/CSP defect. Application security headers were retained. Native preview still needs a headed Chrome/Safari staging acceptance check.
- No browser JavaScript exceptions. New browser test runner lint passes. Existing application lint debt is unchanged from the previous review.

Evidence: `test-audit/BROWSER-RESULTS.json`, `test-audit/RESULTS.json`. Local ignored screenshots include `test-audit/browser-artifacts/rendered-pdf.png`, `pdf-comparison.png`, and `drawing-preview.png`.

## Concrete launch blockers and the smallest next steps

| Blocker | Required action and approval boundary |
| --- | --- |
| Review branch cannot be pushed | Noninteractive push dry-run still fails: `unable to get password from user`. Git uses `osxkeychain`; no usable terminal credential. GitHub Desktop 3.6.6 is installed, but this executor has no supported desktop-control tools to inspect its signed-in state. Rob can authenticate Desktop and publish the existing `review/customer-auth-isolation` branch from this checkout. Do not create another repository or push main. |
| Current Cloudflare state not freshly verified | The separate browser task reported the Mac locked; no fresh resource/configuration check completed. Unlock the Mac and resume its read-only inspection. Prior observations are not treated as current verification. |
| Isolated runnable staging absent | Confirm/approve a separate Worker `planflo-staging`, D1 `planflo-staging-db` bound as `DB`, and R2 `planflo-staging-files` bound as `FILES`. Verify actual account/resource IDs before any migration. R2 activation, provisioning, spend and deployment each remain approval-bound. |
| No approved reachable staging URL | Select the exact staging hostname and approve access/routing. The template intentionally disables workers.dev, previews and routes; it is not an online configuration. Set the exact HTTPS origin in `PLANFLO_AUTH_ORIGIN`; never point staging at production storage. |
| Email service not implemented/configured for live delivery | Choose an existing authorized mail provider and verified sender/domain. Implement its internal `AUTH_EMAIL` service adapter, including acceptance/queueing, retries and delivery monitoring. Verify signup/recovery delivery to an authorized test inbox. No public test mailbox or verification bypass may substitute. Provider signup, API grants/secrets, domain/DNS verification and paid usage require approval. |
| Authentication secret absent | Approve secure configuration of a random `BETTER_AUTH_SECRET` of at least 32 characters. Keep it outside source/logs. Standalone authentication fails closed without required configuration. |
| Rob platform identity absent | After Rob's customer account is verified, approve pinning both `PLANFLO_PLATFORM_OWNER_ID=auth:<actual-id>` and his verified email. No first-user promotion or automatic linking to Sites ownership. |
| Deployed acceptance and cutover not completed | Apply migrations only to confirmed staging, run two-company acceptance and real email tests, check native file preview/download on desktop and mobile, inspect logs/limits, and review destination, backup, rollback and any explicit old-account ownership mapping. Only then review a production deployment. |

No purchase or custom domain is inherently required to perform a separately approved Worker-hostname staging test. This is not confirmation of account entitlements or free-tier capacity. Existing beta can remain untouched while staging is completed.

## Reproduce the browser run

Build first. `pnpm test:browser` uses Playwright from the existing environment (or an explicitly supplied `PLANFLO_PLAYWRIGHT_MODULE`) and Chrome from `PLANFLO_CHROME_PATH`; it does not install either. It binds only `127.0.0.1:5201`, creates synthetic fixtures, and disposes the browser and Worker afterward. `pnpm test:security` reruns the independent 206-check harness.

The afternoon target depends on resolving the above external blockers and passing deployed acceptance. Local results do not support claiming that live customer signup or mail is working yet.

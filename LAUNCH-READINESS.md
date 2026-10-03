# PLAN.FLO launch checkpoint — 3 October 2026

**Local application checks pass. Independent customer production launch is not yet verified or ready to approve.** The review branch is published through c812ba8; isolated staging D1/R2 now exist according to the parent browser audit. Staging migrations, approved runtime configuration, provider setup and real email delivery remain blockers. No production settings, records, secrets, deployments, paid services or provider accounts were changed.

## Observed locally

- Saved implementation commit `6dc1c3b758979a76bc45289a8af41c72c9e9bb6a` was clean at resumption. The follow-up replaces the unreliable native PDF embed with PDF.js canvas rendering; see the PDF fix below.
- Existing 225 security/handler tests pass again; type check and production build pass again.
- Added 59 passing browser/Worker checks (both headless and headed Chrome) using the installed Chrome in its own headless process, local Miniflare/workerd, fresh disposable D1/R2 and an in-memory email service. No user browser profile, Safari session, production data or provider credentials were used. External HTTP requests were blocked.
- UI-driven checks: signup, email verification, sign-in, company creation, project creation, invitation continuation through signup and acceptance, password recovery and new-password login, visible account/logout flow, and core screen navigation.
- Authenticated browser requests: tasks with drawings, schedule shifts, timesheets, RFIs and draft variations save/reload; PDF upload, exact-byte download and revision history work. These saves were not all manually entered through each feature's form.
- Two synthetic companies remain isolated; guessed other-company file IDs return 404. Staff default to no projects, receive exactly the assigned project, cannot promote themselves or access platform administration, and lose access immediately when disabled. A separately pinned synthetic Rob identity can access platform administration; company owners cannot.
- PDF primary preview and comparison now render through PDF.js. Visual inspection and pixel tests pass for the primary preview, page navigation, original/revised files, page-specific markups, explicit download, corrupt-file errors and recovery. Native embedding remained blank under automation, including a local response diagnostic without CSP; the exact native-plugin cause remains unconfirmed. No server security headers or authorization checks were weakened.
- No browser JavaScript exceptions. New browser test runner lint passes. Existing application lint debt is unchanged from the previous review.

Evidence: `test-audit/BROWSER-RESULTS.json`, `test-audit/RESULTS.json`. Local ignored screenshots include `test-audit/browser-artifacts/rendered-pdf.png`, `pdf-comparison.png`, and `drawing-preview.png`.

## Concrete launch blockers and the smallest next steps

| Blocker | Required action and approval boundary |
| --- | --- |
| Latest email/bootstrap commit needs publication | Parent confirmed review branch c812ba8 published and main unchanged. Publish the subsequent reviewed email/bootstrap commit only on review/customer-auth-isolation through authorized GitHub Desktop. Terminal Git still lacks credentials. |
| Production Worker remains unconfigured | Parent audit found plan-flo without bindings/vars/routes, with workers.dev disabled and its latest build failing on placeholder DB id (10181). Preview branch builds remain off. Keep that Worker unchanged during staging. |
| Isolated staging not yet initialized/deployed | Parent confirmed empty D1 planflo-staging-db UUID 047774fa-ac31-45a1-b9a8-0144cc6c8e79 and empty/private R2 planflo-staging-files. Tracked config is staging/wrangler.staging.json. Recheck isolation, then apply the approved staging/bootstrap handoff. No remote SQL has run from this executor. Wrangler whoami returned loggedIn:false. |
| No approved reachable staging URL | Select the exact staging hostname and approve access/routing. The template intentionally disables workers.dev, previews and routes; it is not an online configuration. Set the exact HTTPS origin in `PLANFLO_AUTH_ORIGIN`; never point staging at production storage. |
| Email service implemented; real setup/delivery unverified | workers/auth-email contains the private Resend adapter, validation, bounded retries and idempotency. 39 synthetic tests pass, including workerd service binding. User approved proper email setup; parent handles Resend signup and notifications.planflo.app verification with tracking disabled. Proposed sender: no-reply@notifications.planflo.app. Provision its restricted sending key as Worker secret, deploy privately and verify real inbox delivery after permission. No provider account/key or real mail was used in these tests. |
| Authentication secret absent | Approve secure configuration of a random `BETTER_AUTH_SECRET` of at least 32 characters. Keep it outside source/logs. Standalone authentication fails closed without required configuration. |
| Rob platform identity absent | After Rob's customer account is verified, approve pinning both `PLANFLO_PLATFORM_OWNER_ID=auth:<actual-id>` and his verified email. No first-user promotion or automatic linking to Sites ownership. |
| Deployed acceptance and cutover not completed | Apply migrations only to confirmed staging, run two-company acceptance and real email tests, check canvas preview/download on desktop and mobile, inspect logs/limits, and review destination, backup, rollback and any explicit old-account ownership mapping. Only then review a production deployment. |

No purchase or custom domain is inherently required to perform a separately approved Worker-hostname staging test. This is not confirmation of account entitlements or free-tier capacity. Existing beta can remain untouched while staging is completed.

## Reproduce the browser run

Build first. `pnpm test:browser` uses Playwright from the existing environment (or an explicitly supplied `PLANFLO_PLAYWRIGHT_MODULE`) and Chrome from `PLANFLO_CHROME_PATH`; it does not install either. It binds only `127.0.0.1:5201`, creates synthetic fixtures, and disposes the browser and Worker afterward. `pnpm test:security` reruns the independent 225-check harness.

The afternoon target depends on resolving the above external blockers and passing deployed acceptance. Local results do not support claiming that live customer signup or mail is working yet.

## PDF preview fix

`app/drawing-pdf.tsx` loads the same authenticated file endpoint using the already-installed PDF.js package and worker. It renders a selected page to canvas with loading and error states. Page controls reset on drawing/revision changes. New markups include their page; older markups without a page stay on page one. An explicit same-origin download link preserves the original bytes. Existing company/project/revision authorization and response security headers are unchanged. Build/type check, all 225 security checks and 59 browser checks pass. New-file lint is clean; workspace lint remains at its baseline 30 errors / 25 warnings.

## Exact isolated staging approval bundle

1. Create Worker `planflo-staging`, D1 database `planflo-staging-db` (binding `DB`) and R2 bucket `planflo-staging-files` (binding `FILES`) in the reviewed account. Do not reuse the empty `site-creator-r2` or placeholder DB configuration accidentally. Actual database ID must be copied from the created resource and independently verified. Review charges/entitlements before activation; no paid service is authorized by this document.
2. Select and approve a reachable staging hostname. Candidate inferred from the existing account subdomain: `https://planflo-staging.11robbied.workers.dev`; verify availability before use. Enable workers.dev only for this staging Worker if approved. Keep production routes/main settings and preview-branch builds unchanged.
3. Set staging variables `PLANFLO_AUTH_MODE=standalone`, `PLANFLO_DEPLOYMENT=staging`, and `PLANFLO_AUTH_ORIGIN=<exact approved HTTPS origin>`. Approve creation of a random secret in `BETTER_AUTH_SECRET`; never commit its value. Do not enable the managed-sites identity adapter on this Worker.
4. Create an internal mail Worker `planflo-staging-mail`, bound to the app as `AUTH_EMAIL`. Current app contract is POST `{to,purpose,url}` with success only after accepted delivery/queueing. The Resend adapter and bounded retry mechanism are implemented in workers/auth-email; verified sender, provider secret, deployment and actual delivery checks remain. No public mock mailbox or verification bypass is acceptable.
5. Email choices: reuse an existing authorized provider with a verified sender (smallest setup); otherwise review a new Resend or Postmark account/verified sender and approve its credentials/domain steps before implementing that adapter. Neither provider is configured. Reference APIs: https://resend.com/docs/api-reference/emails/send-email and https://postmarkapp.com/developer/api/email-api . Test real delivery only to approved recipients.
6. Approve applying all migrations to the confirmed empty staging D1, including 0024 project assignments and 0025 customer auth and 0026 registration profiles. Test synthetic companies first. No production migration or old-account linking is included.
7. Rob completes verified signup in staging; then approve pinning `PLANFLO_PLATFORM_OWNER_ID=auth:<actual user id>` and `PLANFLO_PLATFORM_OWNER_EMAIL=<verified email>`. Keep platform administration closed until both match.
8. Approve staging deployment and its access scope, then run real-mail/browser/isolation acceptance on that exact URL. Production cutover remains a separate reviewed action.

## Database correction handoff

Rob's later “fix it” instruction authorizes the isolated database correction; it does not authorize new secrets/grants, paid-plan upgrades or production cutover. Browser owner should create/verify `planflo-staging-db` and report its actual UUID. Create/verify `planflo-staging-files` separately. Keep `plan-flo` and its old main build unchanged.

After confirming the new database is empty and isolated, use tracked `staging/wrangler.staging.json` with its verified DB UUID, replace the approved staging origin and mail sender in both configs, and validate with `pnpm staging:check`. Configure the mail binding only once that service exists. The ordered schema operation for a NEW empty database is:

```sh
pnpm exec wrangler d1 migrations apply planflo-staging-db --config staging/wrangler.staging.json --remote
```

This applies every migration in `drizzle/` from `0000` through `0026`; do not apply only the last two to an empty database. Before running it, use a read-only database info/list check to confirm account, name, UUID and binding point exclusively to staging. Afterward verify migrations applied and expected auth/company/project tables exist; no production migration is part of this command's authorization.

Build source from `review/customer-auth-isolation`, not the different Desktop checkout's main branch. A deployment is a later separately reviewed step, not a side effect of creating the DB or applying this schema. If email/origin/secret configuration remains missing, the app deliberately refuses independent authentication; successful build/database setup alone is not launch acceptance.

## Requested www.planflo.app registration experience

The standalone logged-out root now renders sign-in plus Create account directly. This was verified locally; live www.planflo.app routing, TLS and DNS are owned by the separate browser/deployment task and have not been claimed working here. Set PLANFLO_AUTH_ORIGIN to the exact approved canonical HTTPS host when deploying (for the requested canonical host: https://www.planflo.app). Any apex redirect should lead to that host before authentication; do not split cookie/login origins inadvertently.

Signup captures Name (first name), Surname, Business/sole trader name, ABN, Address, Email address, Phone number, REC and password. Names/contact/business drafts persist on auth_user; the name displayed in the app combines first name and surname. Draft fields are excluded from the auth session response. Company onboarding after verified-email login is prefilled and confirmed once, copying business/contact/REC fields to the existing owner-keyed company settings. REC is visible in company details as supplied, not verified. Repeat signup cannot replace an existing verified profile; repeat company onboarding cannot overwrite a company.

Design choice: self-service business signup requires the requested fields, including REC. Staff signup reached through an invitation requires personal name/surname/email/phone/password; business/ABN/address/REC remain visible but optional because joining must not create or alter an independent company. The client intent does not grant access: a user who skips business fields still cannot create a company without validated required details. Accepting a verified-email invitation applies only the server-side invitation's company and role.

ABN validation is local length/format/modulus-89 checking following [ABN Lookup's published algorithm](https://abr.business.gov.au/Help/AbnFormat). It does not submit information to ABR or verify registration status. Phone and text fields receive server-side bounds/format validation. REC is registration data supplied by the user, never an accreditation assertion.

Migration 0026_registration_profile.sql adds seven default-empty auth_user profile fields and settings.rec. Existing accounts are retained without fabricated names or registration data. For fresh staging apply every migration 0000–0026; if staging already has 0000–0025 applied, apply only the pending migration through the migration runner. Do not reset/recreate existing tables. The migration must precede deploying this code.

Final verification: 225 handler/security checks and 59 headed-browser checks pass, with build/type check and registration-module lint clean. Browser checks cover the root login/Create account entry, prefilled onboarding, invitation safety, mobile overflow, invalid ABN error with retained form values and successful retry. Screenshots are in the ignored local browser-artifacts directory, including mobile-signup.png.

## Email and bootstrap handoff

See `workers/auth-email/README.md` for exact provider/sender/secret setup and delivery limits, and `staging/bootstrap/HANDOFF.txt` for the repeat-safe empty-database dashboard bootstrap. All 140 bootstrap statements were replayed in isolated D1 and matched migrations 0000–0026 exactly: 43 tables, 41 indexes, 55 triggers; retry preserved the timestamp seed and 27-entry ledger. No dashboard transaction guarantee is assumed. Parent reports planflo.app nameservers switched to Cloudflare and activation pending; this executor did not operate DNS or browser UI.

## Live staging configuration preservation

Parent now reports staging.planflo.app serving login, unauthenticated data returning 401, and both runtime secrets entered by the owner. `staging/DEPLOYMENT.md` supersedes earlier private-only deployment instructions: the checked-in app config preserves its approved Custom Domain and exact origin; mail remains private. No push/deploy is part of this configuration commit. Platform-owner pins remain unset pending Rob's verified immutable account identity and explicit approval.

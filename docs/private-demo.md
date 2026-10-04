# Private Riverside Warehouse demonstration

Entry: `/demo`, or **Private demo** in the verified demo owner’s workspace sidebar. Company branding is the approved name **Urban Charge Electrical**; the project is **Riverside Warehouse**. No real company logo or registration/contact details are copied.

The demo is view-only. Tabs, weekly timesheet filtering and record-detail dialogs work, but they do not persist changes or call live tenant APIs. Reloading returns the same sample snapshot dated 2 October 2026. There is no reset operation because demo state is not written to a database or browser storage.

## Isolation and access

The page, `/api/demo`, and `/api/demo/drawing` each enforce the separately configured demo owner’s exact immutable auth subject and verified email. The existing platform user and account must both be Active; absent configuration/status or database failure denies access. Ordinary company owners/admins, other tenants, disabled or unverified users, and anonymous requests cannot retrieve the sample dataset or drawing. Client-supplied company/project/file selectors are rejected by the APIs. POST, PUT, PATCH and DELETE are rejected, including for the owner.

Only platform status metadata is read to authorize the request. Demo content comes from the server fixture module, never from tenant projects, settings, staff, invoices, memberships, files or integration storage. The drawing is generated server-side, labelled fictional/not for construction, and is protected by the same authorization. It has no external resources. JSON and drawing responses use private no-store caching; the page is dynamic and marked noindex. Browser release checks also inspect public client assets to prevent fixture values from leaking into unauthenticated bundles.

Fictional staff are display data only: no auth accounts, invitations, email, payroll submission or integration connections. No public/prospect access, ownership changes, or sharing grants are introduced. No packages or migrations are required. Dedicated PLANFLO_DEMO_OWNER_ID and PLANFLO_DEMO_OWNER_EMAIL runtime settings are required; absent settings deny demo access. Platform-owner settings confer no demo access, and demo settings confer no platform administration rights.

## Reconciled sample snapshot

All amounts are AUD ex GST.

- Base contract: $240,000.
- Exactly three variations: Approved $18,000; Approved $7,500; Pending $9,800. Approved is the existing app status for accepted variations.
- Revised contract: $265,500. The pending variation is excluded; potential contract if approved would be $275,300.
- Current cost budget, including approved scope: 1,600 labour hours / $120,000 labour plus $85,000 materials = $205,000.
- Four fictional staff: Alex Demo 120h × $80 = $9,600; Casey Demo 160h × $70 = $11,200; Jamie Demo 120h × $70 = $8,400; Taylor Demo 100h × $40 = $4,000. Total 500h / $33,200, across 70 dated entries.
- Three sample material expenses: $15,600 + $12,400 + $6,800 = $34,800. Actual total cost is $68,000.
- Budget less actual costs: $137,000, including outstanding commitments. The $12,000 issued PO is not an expense or payment and is not double-counted in actual costs. Materials budget less actuals and that commitment is $38,200.
- Four of nine equally weighted stages complete: 44% rounded. Stage completion is independent of spend/hours; no forecast margin is claimed.
- Two RFIs: one Responded (answered), one Issued (open). Six tasks: three complete, three open. Two fictional site diary entries and one illustrative warehouse drawing.

These are fictional internal cost rates and records, not actual Urban Charge prices, employee information, engineering documents or payroll guidance. Business records and attachment storage remain unchanged.

## Staging activation — not performed by code deployment

On `planflo-staging` only, configure encrypted runtime bindings `PLANFLO_DEMO_OWNER_ID=auth:<exact raw auth_user.id>` (one prefix) and `PLANFLO_DEMO_OWNER_EMAIL=<verified email>`. Never guess from a display name, use an old Sites ID, or populate platform-owner settings for this purpose.

First use a supported browser in Rob's existing signed-in staging session to inspect only current-account identity fields. If supported browser automation is unavailable, after deploying this fix ask Rob to open **Your account → Your account details** (`/account-details`) in his signed-in Safari and provide a screenshot. This read-only, no-store page shows only the current account ID (already prefixed `auth:`), email and Verified status, rejects user selectors, and never emits session tokens. Do not ask him to copy the full session API response. Strip the single `auth:` prefix only for the exact raw D1 auth_user lookup; use the displayed account ID unchanged for the demo binding. Require verified=true and confirm the account is Rob's. Corroborate that exact ID in staging D1 using only id/email/email_verified and the linked platform user/account statuses. Both platform statuses must be Active; do not modify them to bypass a denial. Record the approved identity pair privately for the bounded configuration operation, never in source.

Coordinate approval for the exact candidate and these two bindings before publication/configuration. Preserve all existing settings, including any platform pins; do not add, remove or modify platform privileges. Do not initiate fresh Cloudflare OAuth without separate approval. If fresh Wrangler OAuth is approved, explicitly review the requested scopes rather than accept its broad default set: this installed version supports `account:read`, `user:read`, `workers_scripts:write`, and `d1:write`, and automatically adds `offline_access`. D1 OAuth is write-capable even though this task needs only a SELECT; approval must acknowledge that scope, while execution stays read-only on D1. Worker script scope permits binding changes; restrict actual operations to the approved Worker and two demo bindings. No OAuth has been initiated by this change.

After activation verify Rob can see Private demo and open the page, JSON and drawing; verify his platform-admin access is unchanged/denied for a demo-only account. Confirm anonymous and other-account denial. A deployment without these verified bindings is not a completed demo delivery. Local acceptance uses different synthetic platform and demo owners to prove separation.

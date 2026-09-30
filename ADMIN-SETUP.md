# PLAN.FLO platform administration

The operator portal is at `/admin`. The workspace displays a Platform admin link only for trusted operators. Company owners and admins do not receive platform access.

Set `PLANFLO_ADMIN_EMAILS` in the Sites runtime environment to a comma-separated list of verified ChatGPT account email addresses, then deploy to apply it. With no value the portal fails closed. This list cannot be changed by company users or through the admin API. Local API tests use `operator@example.test` through Wrangler's `--var PLANFLO_ADMIN_EMAILS:operator@example.test` option. Do not use the test address in production.

The production hosting layer must provide trusted authenticated identity headers; never expose the worker directly behind a proxy that passes arbitrary client-supplied identity headers. Public customer onboarding and a different identity provider are separate deployment work. Current site audience rules still apply.

## Records and access

The directory records identities on authenticated app access, including email, display name, first recorded use, last seen and company. These are not exact signup or login events. Passwords and authentication tokens are never collected or exposed by the portal. Usage counts section views and distinct users; it starts when this version is deployed, with no historical backfill. It does not send activity to an external analytics service.

Account Active/Suspended/Closed status controls app access for every company member. Closed accounts retain their data and can be reactivated; this is not data erasure. User suspension independently blocks that identity. Operator accounts are protected against lockout. Existing company membership roles and module restrictions remain enforced. Changes require version checks and appear in the append-only application audit history.

Company details, internal notes, member role/seat/permissions and access statuses can be edited. Pending invitations must still be accepted by their intended recipient; disabled pending invitations must be reissued from the company settings page. Operators cannot recover passwords or bypass invitation acceptance.

## Support and billing

The support queue reads feedback across companies. Categories and priorities are inferred from submitted type and impact and can be changed by an operator. Tickets support assignment, status and internal notes. Notes are never returned by the company feedback API and do not send email. Company administrators can still view and update their own feedback status.

Subscription values shown are the app's stored records. Closing or suspending an app account does not cancel a Stripe subscription, issue refunds, erase records or send messages. Live Stripe billing management and revenue analytics require separate integration/configuration. No full card details are available.

## Verification

Run the TypeScript check and production build. Apply the append-only Drizzle migrations to a local D1 database, start the built worker locally with the test operator environment value, then run `node tests/platform-admin-api.mjs`. Tests create only local fixtures and cover operator isolation, suspension at API level, restoration, private ticket notes, optimistic concurrency, audit history and usage recording. Existing app-settings and scheduling API tests provide regression coverage.

## Analytics

Overview remains unchanged. The separate Analytics page contains Growth, Product usage, Support and Revenue tabs. Its reporting window is the current UTC calendar day plus the preceding 29 days, compared with the preceding 30-day period. Historical comparisons may be incomplete until enough section-view history exists.

Company growth uses first recorded account access, not an unverified signup timestamp. Setup milestones reflect currently retained projects, drawings and active memberships. Follow-up suggestions are active companies with no project after seven days or no section visit for fourteen days; they do not automatically contact customers. Adoption uses section visits among active companies with the module currently enabled, not historic entitlement snapshots or completed actions. Work counts use the existing persisted review activity log; equipment checks created are not assumed to be signed off.

Storage totals use file metadata and include all retained drawing revisions. Requested-package allowances are labelled as indicative. Upload outcome recording includes authenticated, non-blocked requests to file and drawing-revision upload endpoints, including validation/permission failures; network requests that never arrive cannot be measured. Logging failure does not invalidate a successful upload. No filenames or file contents are copied to the upload outcome log.

Support resolution timestamps start with this change. Reopening clears the timestamp; resolving again measures from original ticket creation to the latest resolution. Already resolved tickets without a timestamp are omitted from the median. Both company feedback status updates and platform ticket edits maintain this timestamp. Topic tags are operator-entered and grouped exactly; there is no automatic AI classification. Revenue remains unavailable until verified live Stripe events are integrated.

## Platform Invoicing & Billing

The dedicated admin section lists company billing records, requested packages, billing frequency and additional users. Requested totals are recalculated using the current catalogue and labelled as estimates excluding GST; they are not invoice totals, confirmed subscriptions or revenue.

Opening a company loads Stripe invoices (25 per page, with status filters) and subscriptions (up to 100, including cancelled records). Only the server-stored `billing_accounts.customer_id` selects the Stripe customer; request parameters cannot override it. The server checks returned customer IDs and live/test modes and exposes only a limited invoice/subscription field set. Invoice links accept HTTPS Stripe domains only. No full card details, provider credentials or raw customer records are returned.

`STRIPE_SECRET_KEY` enables read access, supporting secret or restricted keys in test/live mode. Restricted keys need invoice and subscription read permissions. No key shows a clear disconnected state. This does not lift the existing test-only checkout guard or implement live webhook entitlement processing. No admin charge/refund/cancel endpoints were added; those operations stay in the authenticated Stripe dashboard. Opening an external Stripe customer page requires the operator's own Stripe login. App account closure still does not cancel billing.

References: https://docs.stripe.com/api/invoices/list and https://docs.stripe.com/api/subscriptions/list. The adapter uses the existing application's pinned API version, 2025-02-24.acacia.

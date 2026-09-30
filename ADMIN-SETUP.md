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

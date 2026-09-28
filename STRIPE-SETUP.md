# Stima Stripe setup

Implemented: authenticated administrator-only hosted Checkout, Customer Portal, paginated invoice history with Stripe PDF links, server-side package/price validation, company customer isolation and duplicate-checkout protection. No card numbers enter Stima.

## Connect a Stripe sandbox first
Set these in Sites runtime configuration, not source control:
- STRIPE_SECRET_KEY (secret): sandbox sk_test_ key.
- STRIPE_PRICE_BASIC: recurring AUD 29/month, exclusive tax.
- STRIPE_PRICE_STANDARD: recurring AUD 49/month, exclusive tax.
- STRIPE_PRICE_PRO: recurring AUD 99/month, exclusive tax.
- STRIPE_PRICE_BUSINESS_PRO: recurring AUD 149/month, exclusive tax.
- STRIPE_PORTAL_CONFIGURATION: portal configuration ID from the same sandbox.

Enable Stripe Tax with the appropriate business registration settings and product tax codes. Checkout uses automatic tax and collects the billing address. Configure the portal to permit payment method management, billing detail changes, invoice history, cancellation and switching among the four monthly products. Confirm proration and cancellation policy with the owner before enabling live billing. Redeploy after changing environment values.

## Verification required
With test credentials verify each package checkout, successful and failed payments, cancellation, repeated checkout clicks, portal upgrades/downgrades, cards, invoices, and two companies' isolation. API/type/build checks without credentials do not verify Stripe end to end.

## Before live payments
Live keys are deliberately rejected by the current readiness check. The app remains a prototype with no paid entitlement enforcement. Implement signed Stripe webhook delivery and enforce subscription features/usage server-side before removing this guard. This owner-private Sites deployment requires sign-in, so first establish a supported externally reachable webhook endpoint without weakening app access. Add separate test/live customer mappings when enabling production billing; do not reuse sandbox customer IDs. Test webhook replay, out-of-order events and failed renewal handling. GET currently reads current billing directly from Stripe and does not persist paid status in the legacy subscriptions table.

Never paste secret keys into chat or put them in a client-side environment variable. No live credentials or payment attempts were made during implementation.

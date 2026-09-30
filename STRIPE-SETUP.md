# PLAN.FLO Stripe setup

Implemented: authenticated administrator-only hosted Checkout, Customer Portal, paginated invoice history with Stripe PDF links, server-side package/price validation, company customer isolation and duplicate-checkout protection. No card numbers enter PLAN.FLO.

## Connect a Stripe sandbox first
Set these in Sites runtime configuration, not source control:
- STRIPE_SECRET_KEY (secret): sandbox sk_test_ key.
- STRIPE_PRICE_BASIC: recurring AUD 49/month, exclusive tax.
- STRIPE_PRICE_STANDARD: recurring AUD 129/month, exclusive tax.
- STRIPE_PRICE_PRO: recurring AUD 249/month, exclusive tax.
- STRIPE_PRICE_BUSINESS_PRO: recurring AUD 449/month, exclusive tax.
- STRIPE_PORTAL_CONFIGURATION: portal configuration ID from the same sandbox.

Enable Stripe Tax with the appropriate business registration settings and product tax codes. Checkout uses automatic tax and collects the billing address. Configure the portal to permit payment method management, billing detail changes, invoice history, cancellation and switching among the four monthly products. Confirm proration and cancellation policy with the owner before enabling live billing. Redeploy after changing environment values.

## Verification required
With test credentials verify each package checkout, successful and failed payments, cancellation, repeated checkout clicks, portal upgrades/downgrades, cards, invoices, and two companies' isolation. API/type/build checks without credentials do not verify Stripe end to end.

## Before live payments
Live keys are deliberately rejected by the current readiness check. The app remains a prototype with no paid entitlement enforcement. Implement signed Stripe webhook delivery and enforce subscription features/usage server-side before removing this guard. This owner-private Sites deployment requires sign-in, so first establish a supported externally reachable webhook endpoint without weakening app access. Add separate test/live customer mappings when enabling production billing; do not reuse sandbox customer IDs. Test webhook replay, out-of-order events and failed renewal handling. GET currently reads current billing directly from Stripe and does not persist paid status in the legacy subscriptions table.

Never paste secret keys into chat or put them in a client-side environment variable. No live credentials or payment attempts were made during implementation.

## Annual billing and additional users
The subscriptions screen saves an administrator's selection in D1, separately from paid subscription status. Extra seat selectors do not charge cards, invite users or activate a subscription. Office/field classification is saved with company users; field users cannot receive administrator or commercial-tab permissions. Existing users default to office users. Active and pending members count toward usage; disabled members do not, and the owner counts as one office user.

Additional Stripe prices (all AUD, exclusive tax, interval_count 1):
- STRIPE_PRICE_EXTRA_OFFICE: 29/month.
- STRIPE_PRICE_EXTRA_FIELD: 7/month.
- STRIPE_PRICE_BASIC_ANNUAL: 490/year.
- STRIPE_PRICE_STANDARD_ANNUAL: 1290/year.
- STRIPE_PRICE_PRO_ANNUAL: 2490/year.
- STRIPE_PRICE_BUSINESS_PRO_ANNUAL: 4490/year.
- STRIPE_PRICE_EXTRA_OFFICE_ANNUAL: 290/year.
- STRIPE_PRICE_EXTRA_FIELD_ANNUAL: 70/year.

Annual totals charge ten times the monthly amount, including extra users. This gives two months free. Backend verifies every line item's actual Stripe amount, currency, tax behaviour, active flag and interval before opening checkout. Replace the old monthly price IDs; Stripe prices are immutable. Missing annual/extra price IDs block their checkout but not saved selections. Checkout sessions are only reused for the exact same package, cycle and seat quantities.

Existing subscriptions are managed in the Stripe portal. Configure the portal to offer the new package prices and allow quantity adjustments for the extra office/field products, with a maximum quantity of 500 per extra-user product. The app's saved selection does not silently amend an existing subscription. Verify changes and proration in Stripe before confirming.

Founding-customer discounts and free external reviewer accounts have not been activated. Coming-soon estimating, live Xero sync, business reporting/approval workflows and onboarding/support offerings are explicitly labelled as planned. Daily review describes the existing activity review, not a live AI service. Product feature and paid-seat enforcement still require production commissioning.

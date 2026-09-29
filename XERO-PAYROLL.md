# Xero Payroll preparation

This release implements local preparation and review only. No OAuth client, Xero API calls, token storage or payroll submission is enabled. `/api/payroll` rejects connect, disconnect and send actions. Secrets must not be entered in the UI.

## Implemented
- Administrator-only Settings → Integrations → Xero.
- Persistent weekly/fortnightly cycle and a known period-start date.
- Stable local employee profiles, explicit legacy-name aliases, duplicate-name checks and prevention of deleting an existing identity.
- Separate ordinary, 1.5× overtime and 2× overtime labels on time entries. No automatic award or wage calculations. Existing entries remain unclassified.
- Administrator review of all projects in a complete period, with category/identity correction.
- Approved snapshots contain hours and categories, not project hourly rates. Approval actor, timestamp and action history are saved.
- Fingerprints cover current time records and payroll setup. Changes invalidate approval; stale/concurrent writes are checked. Unique company/period reviews avoid duplicate local approval rows.
- Local sync state remains Not sent. Xero employee and earnings-rate matching controls are disabled until authorised data is available.

## Remaining before live use
Register the Xero app; implement OAuth callback/state validation, encrypted server-side token storage and refresh/disconnect; verify AU payroll access; load real Xero employees, pay calendars and eligible earnings rates; persist and validate mappings; implement export attempts, idempotency/reconciliation with existing Xero timesheets, post-sync change handling and processed-payroll protection; test against a Xero test organisation before enabling submission. Do not interpret local approval as Xero approval or payroll processing.

Local API regression: `node tests/payroll-foundations.mjs` against the local preview only. Apply migration 0015 before running it.

# Daily Review

Daily Review lives in workspace My Tasks. Real project changes are captured transactionally by SQLite triggers from this migration onward. Sources: tasks (excluding generated review tasks), time, cost/invoice references, RFIs, variations, site diary, equipment checks, test/tag, uploaded project files/drawing revisions, Site Docs and O&M records. Earlier changes are not reconstructed.

The queue groups each source to its latest captured change, carries unresolved items forward, and reopens after a new change. Activity log retains individual snapshots. Reviewed lists decisions by decision date. Dates use Australia/Melbourne with daylight-saving boundaries; today includes activity up to refresh, not a fixed 5 pm cutoff. Results are paginated in groups of 100.

Permissions require Tasks view plus the source section's view permission. Decisions additionally require Tasks edit. Company ownership is checked on reads and writes. Follow-up decisions and task creation are batched, repeat clicks are idempotent, and existing open source follow-ups are reused. A review does not modify or approve the source. Generated review tasks do not feed back into the review queue.

## Pending integrations
Suggestions currently use deterministic rules and saved record metadata. They do not use an AI model or inspect uploaded documents. No AI credentials are configured. Generation happens when opening or refreshing the page; no background schedule or notifications were configured. The deployed interface discloses these limitations.

To add a genuine daily AI brief, connect an approved server-side AI provider, define permitted source fields and file analysis, validate grounded suggestions against source IDs, and provision a supported scheduler with company-scoped service access. Preserve source permissions, idempotency and manager confirmation. Never put API credentials in browser code.

## Verification
TypeScript and production build; migration/trigger tests; local API checks for event capture, task creation, concurrent requests, source update reopening, open task reuse, company/source permissions, decision persistence and invalid dates; Melbourne timezone tests covering 23-hour and 25-hour days. No live data was used in functional tests.

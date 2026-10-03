# Gmail supplier invoices

Status: the integration is implemented but no production Gmail account or Google credentials are configured. Nothing is read until an administrator connects a mailbox and enables invoice checks.

## Activation

1. Create a Google Cloud project, enable Gmail API and configure the OAuth consent screen for PLAN.FLO. The gmail.readonly scope is restricted; complete Google's applicable verification before general customer availability.
2. Create a Web OAuth client. Register the exact HTTPS callback: https://planwire-projects.sage-pika-6453.chatgpt.site/api/gmail/callback (update this for a future custom domain).
3. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI and GMAIL_TOKEN_ENCRYPTION_KEY as server runtime secrets. Generate a random 32-byte key and base64 encode it for the encryption key. Never put these values in source control or browser configuration. Keep the encryption key stable; replacing it requires reconnecting mailboxes.
4. In Settings → Integrations, connect the company mailbox as a company administrator, then enable invoice checks. Test a real supplier invoice with a unique project PO reference and confirm the extracted information before approval.

## Behaviour and boundaries

- Project Setup stores a company-unique project PO reference. Issued/received individual purchase orders are also eligible for matching.
- Matching requires a complete reference. Unknown references and messages naming multiple projects require manual assignment.
- The initial scan covers 30 days; subsequent scans overlap by one day. Batches handle ten messages and resume with a cursor. Gmail access is read-only; messages are not sent, deleted or marked read.
- PDF text and email text are inspected. Scanned PDFs and images have no OCR and require manual entry. Attachments over 8 MB and PDFs over 50 pages require manual handling.
- Imported invoices appear in project Costs/Expenses and My Tasks → Invoice reviews. Pending invoices do not affect budgets. Reviewers confirm the AUD amount excluding GST, invoice date and supplier before approval creates one expense.
- Message/attachment identifiers prevent repeat imports. Matching file contents or supplier/invoice numbers flag possible duplicates for explicit review.
- Tokens are encrypted with AES-GCM, bound to the company, and only used on the server. OAuth state is single use, expiring and tied to the initiating user/company. Invoice access uses company ownership and Costs permissions.
- Automatic checks run every five minutes while an authorised administrator has the app open. There is no closed-app scheduler or Gmail push subscription yet. Add a server-side job or authenticated Gmail Pub/Sub delivery before promising unattended background processing.
- Disconnection clears the stored token and stops checks. If Google revocation fails, the UI directs the administrator to remove access in Google Account settings.

## Verification

Run `node scripts/check-invoice-workflow.mjs` using Node with node:sqlite support, then the TypeScript check and production build. The test uses an in-memory database, generated PDF and mocked Google responses; it does not contact a real Gmail account. A live OAuth and supplier-invoice test is still required after credentials are configured.

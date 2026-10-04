# Private Riverside Warehouse demonstration

Entry: `/demo`, or **Private demo** in the verified platform owner's workspace sidebar. Company branding is the approved name **Urban Charge Electrical**; the project is **Riverside Warehouse**. No real company logo or registration/contact details are copied.

The demo is view-only. Tabs, weekly timesheet filtering and record-detail dialogs work, but they do not persist changes or call live tenant APIs. Reloading returns the same sample snapshot dated 2 October 2026. There is no reset operation because demo state is not written to a database or browser storage.

## Isolation and access

The page, `/api/demo`, and `/api/demo/drawing` each enforce the existing configured platform owner's exact immutable auth subject and verified email. The existing platform user and account must both be Active; absent configuration/status or database failure denies access. Ordinary company owners/admins, other tenants, disabled or unverified users, and anonymous requests cannot retrieve the sample dataset or drawing. Client-supplied company/project/file selectors are rejected by the APIs. POST, PUT, PATCH and DELETE are rejected, including for the owner.

Only platform status metadata is read to authorize the request. Demo content comes from the server fixture module, never from tenant projects, settings, staff, invoices, memberships, files or integration storage. The drawing is generated server-side, labelled fictional/not for construction, and is protected by the same authorization. It has no external resources. JSON and drawing responses use private no-store caching; the page is dynamic and marked noindex. Browser release checks also inspect public client assets to prevent fixture values from leaking into unauthenticated bundles.

Fictional staff are display data only: no auth accounts, invitations, email, payroll submission or integration connections. No public/prospect access, ownership changes, or sharing grants are introduced. No new credentials, configuration, packages or migrations are required. Existing owner identity configuration is reused without modification.

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

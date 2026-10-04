# Dashboard widgets

Edit widgets opens a draft of the signed-in user's layout for their current company. Drag handles reorder sections; up/down keys on a focused handle and labelled move buttons provide keyboard and touch alternatives. Manage widgets hides or restores existing sections. Contract portfolio remains unavailable without Costs permission; project lists and metrics continue to use permission-filtered source data.

Save layout persists order and visibility in D1, scoped by server-resolved company owner and authenticated user ID. This follows the account across devices. Cancel discards edits and reloads the saved layout. Reset to default changes only the draft until Save. Navigating away discards unsaved changes. Concurrent edits use a version check: stale saves are rejected, with Cancel/reload instructions. Failed saves retain the draft; failed loads show a retry action and disable editing to avoid overwriting an unknown saved layout.

Unknown widget IDs are ignored, duplicates removed, and newly added widgets appended. An all-hidden layout can always be restored through Edit widgets. Layout preferences grant no data permissions.

## Release dependency

Apply additive migration `0029_dashboard_layouts.sql` before publishing this candidate. It adds a separate table and unique company/user index; it does not rewrite existing account, project, integration, or invoice data. Staging migrations through 0028 were previously reported applied; verify the remote ledger under the separately approved release process. No migration or deployment is performed by this change. Missing storage leaves the dashboard visible with a layout-loading error and editing unavailable.

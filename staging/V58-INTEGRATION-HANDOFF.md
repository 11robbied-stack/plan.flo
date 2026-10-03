# v58 + customer-auth candidate

Local integration only. Push, deployment and remote migration remain on hold for review.

Parents: working staging auth/security/branded UI `0ea88f753f23dd8a2422d202e48b2a3f6808f24f`; original Sites v58 `074c21e97abcb9976a81b3a8550c48af5daae590`. Original checkout unchanged. The earlier v54 deployment did not contain the later Sites features; this merge preserves both branches.

## Combined behavior

- Preserves independent signup, verified login, recovery, onboarding, staff invitations, assigned-project restrictions, Rob-only platform boundary, branded login/check-email and canvas PDF preview.
- Restores v55 exports, v56 company-header logo, v57 synthetic-testable Gmail invoice matching/review and v58 saved project PO reference behavior. New POs require that reference; existing POs retain their stored number.
- Adds server-side company/project scope to invoice detail/list/actions and attachment access; filters assigned projects before pagination; company inbox is admin-only. Validates same-company/category/project attachment references and moves attachments with invoice assignment/approval in a database batch. Gmail mutations require an administrator and exact mutation origin. OAuth callback retains user/company-bound single-use PKCE state.
- Adds forward migration 0027; all applied SQL migrations 0000–0026 and their existing snapshot files are unchanged. No import of the original conflicting 0024 migration.
- Adds release checks, clean-candidate preparation, artifact verification, visible build ID and `/api/version`. See [release workflow](../docs/release-workflow.md).

## Verification scope

Final source checks: 273 security/auth checks, 83 local browser checks and 40 mail tests passed. Invoice/Gmail synthetic workflow, PO behavior, five PDF export types, TypeScript and production build passed. Browser checks include signup/recovery, invitations, project access, drawing rendering/revisions, actual synthetic logo upload/render, PO missing-reference blocking, saved read-only reference and Costs invoice review. No browser JavaScript errors.

Migration validation proves 27 applied migration hashes unchanged, 28 ordered migrations and preservation of every preexisting column/row in a populated synthetic 0026-to-0027 upgrade, including password hashes, sessions, membership, assignments and files. Foreign-key checks pass.

`test-audit/RESULTS.json` and `BROWSER-RESULTS.json` record integration parent provenance. The final `release:prepare` reruns checks on the clean committed tree and binds output hashes to that exact commit in ignored `dist/release-manifest.json`; use that file for deployment, not precommit logs. Prior dirty builds are development artifacts.

The initial mail binding test was blocked by the sandbox's localhost restriction; the authorized loopback-enabled rerun passed. Full-repository lint has documented preexisting debt and is not represented as clean. Synthetic Gmail transport does not establish Google OAuth approval or real mailbox behavior. No Google connection or real invoice import was attempted. Existing live login/verification email is confirmed by Rob; this candidate has not been deployed.

## Deployment review

Approve only additive 0027 against the verified staging D1 that already has 0000–0026. Preserve/export existing staging data and verify the pending ledger before applying. Then verify the exact artifact manifest, deploy the app with its checked-in staging configuration and retained secrets, and compare `/api/version`. No mail-worker deployment is included. Its observability drift requires a separate explicit decision.

The known working auth Worker `0ea88f7` is the code rollback baseline; leave additive 0027 in place. Do not reverse/drop schema or restore older Sites authorization. Production/main promotion remains separately gated after staging acceptance. CI initialization failure is an external build-service issue; this release documents a tested direct-deployment fallback without changing provider settings.

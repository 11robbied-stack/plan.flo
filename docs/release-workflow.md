# PLAN.FLO release workflow

## Source of truth

Use `https://github.com/11robbied-stack/plan.flo.git` as the canonical source. A release is an immutable reviewed commit, never an unlabelled workspace build. This integration joins auth/security baseline `0ea88f753f23dd8a2422d202e48b2a3f6808f24f` with original Sites v58 `074c21e97abcb9976a81b3a8550c48af5daae590`, including v55 PDF exports, v56 company logo, v57 Gmail invoice review and v58 project purchase-order references. The original Mac checkout is preserved.

Develop on a feature branch; test the exact candidate on staging; promote that same reviewed candidate through an approved PR to main. Do not merge main, push, deploy or alter build settings without the requested approval. Until the Sites authoring path is retired by an explicit decision, reconcile its latest version/commit before each release. Never silently overwrite newer Sites work with an older auth branch.

Cloudflare Git builds previously failed during initialization before cloning; a later successful build of `0ea88f7` was verified against active version `69ca3d8f-7efa-4d89-9b79-40f3c4a640a1`. The automatic path works, but its original plain build command did not run release gates. Use the reviewed [self-contained CI settings](cloudflare-release-gates.md) for future updates. Keep direct deployment as a reviewed fallback; do not create a second competing source branch. Provider permissions and secrets remain separate work.

## Repeatable commands

Use the lockfile and Node 22.13+ (validated locally with Node 24.19). Install with `pnpm install --frozen-lockfile` under the existing dependency policy.

```
pnpm release:check
pnpm release:prepare
pnpm release:verify
```

`check` verifies applied migration hashes, journal order, isolated 0026-to-0027 and 0027-to-latest data-preservation fixtures, staging configuration, TypeScript, security/auth, invoice/PO/PDF and synthetic mail tests. `prepare` requires a clean committed tree, repeats checks, builds, runs the local browser suite, and writes `dist/release-manifest.json`. `verify` rejects dirty/different source or changed/missing artifacts/configuration. It does not contact Cloudflare or verify remote migration state. Test fixtures use temporary/in-memory D1/R2, synthetic identities/mail and blocked outbound requests.

Browser execution uses the exact pinned Playwright dependency. Run `pnpm browser:install` on macOS, or `pnpm exec playwright install --with-deps chromium` on Linux, before preparing the release. Explicit external Chrome/Playwright overrides remain available for diagnostics but are unnecessary for a clean clone. Local Worker tests require loopback binding permissions. Do not substitute production credentials for missing test configuration.

The workspace sidebar and unauthenticated `/api/version` expose only a short commit identifier (with `-dirty` for development builds). Before/after deployment, compare that ID with the manifest. No secrets, branch paths, user information or provider identifiers are exposed.

## Approved staging deployment only

Last reported staging baseline is `48ded95522c77d3a3ad8e0b36fbed51e99a6b17d` (build `48ded95522c7`) with D1 migrations 0000–0027 applied. Reverify this remotely before deployment; this document is not a live provider check. Do not repeat setup or replace secrets. Before any deployment confirm approval for the exact candidate and migration 0028, then verify the account, Worker, bindings, existing version, backup/export and migration ledger using authorized read-only provider access.

Target configuration: `staging/wrangler.staging.json`; Worker `planflo-staging`; D1 `planflo-staging-db` (`047774fa-ac31-45a1-b9a8-0144cc6c8e79`); bucket `planflo-staging-files`; domain `staging.planflo.app`. Never deploy the generated placeholder `dist/server/wrangler.json` to a remote account.

Before publication, configure and verify Turnstile for `staging.planflo.app` as described in [signup-verification.md](signup-verification.md). Missing keys intentionally block new signup; existing login/recovery remain available. There is no captcha bypass. Gmail/Xero activation is separate and is not a release prerequisite.

After approval and checking that only 0028 is pending:

```
pnpm exec wrangler d1 migrations list planflo-staging-db --remote --config staging/wrangler.staging.json
# STOP if pending migrations differ from the reviewed list; preserve/export existing data first.
pnpm exec wrangler d1 migrations apply planflo-staging-db --remote --config staging/wrangler.staging.json
pnpm release:verify
pnpm exec wrangler deploy --config staging/wrangler.staging.json --keep-vars
```

Run deployment interactively so unexpected route/configuration differences can be reviewed. Compare remote settings immediately beforehand; do not silently overwrite drift. Encrypted existing secrets must be retained. Confirm the migration ledger and build ID afterwards, anonymous data denial, existing login, verification/recovery, company access, PO creation and exports. Stateful acceptance uses only explicitly isolated synthetic staging fixtures. Do not use real Gmail or connect a mailbox as part of release testing.

Already applied migration 0027 adds three Gmail/invoice tables, invoice indexes, a default-empty `projects.purchase_order_number` column, its company-scoped nonempty unique index and five invoice ownership/reference triggers. It does not rewrite applied migrations, credentials, memberships or existing records. Existing POs retain their recorded numbers; new POs require a saved project reference. No Gmail connection is enabled by this migration; Google configuration/consent remains separate.

Migration 0028 adds `xero_connections`, its unique tenant index, and `xero_oauth_states`; no existing tables or rows are rewritten. Preserve a verified D1 backup/recovery point, apply 0028, read back ledger/schema, and only then approve this candidate’s exact schema tree in the builder. The review branch auto-deploys: do not publish to it before migration, Turnstile, and CI prerequisites are satisfied.

The branded mail Worker is a separate deployment. Its remote observability setting differs from checked-in configuration and still needs an explicit decision. This application release does not deploy the mail Worker or modify Resend.

## Rollback and production promotion

Record the predeployment Worker version and retain the exact artifact/configuration. If 0028 succeeds but code deployment fails, leave the additive schema in place and keep the existing auth Worker. Code may roll back to the verified predeployment `48ded95522c77d3a3ad8e0b36fbed51e99a6b17d` baseline while keeping 0028: old code ignores the added Xero tables. Hide/suspend new invoice operations during rollback. Do not reverse SQL, delete invoices or drop auth tables; investigate data changes separately. Never use the old Sites/v54 application as an auth/security rollback target.

A database restore requires separate approval and an explicit recovery point/data-loss assessment. A code rollback is not a database rollback. Test the migration on populated synthetic data before applying it, and preserve the remote recovery point before touching real data.

Only after staging acceptance and explicit production approval should the reviewed commit be promoted to main and deployed to the approved production/www configuration. This repository does not add automatic production deployments, new provider accounts, paid services or CI secrets. Production target IDs and migration ledger must be independently verified; never reuse staging bindings as production.

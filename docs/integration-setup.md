# Gmail and Xero setup and account linking

This change replaces disabled integration buttons with setup dialogs and readiness checks. Xero linking and read-only payroll matching are implemented; sending timesheets or running payroll is not implemented or authorised by this change.

## Release prerequisites

Review the feature branch, run `pnpm release:check` and the browser suite, and approve the exact staging candidate before publication or deployment. Apply additive migration `0028_xero_connections.sql` only after authorised staging backup/recovery-point and ledger checks. It adds Xero connection and one-time authorisation-state tables. It does not change existing Gmail, auth, project or payroll data. Verify the applied migration and separately approve the new `drizzle` tree in the release gate; never derive approval automatically. Existing main/www targets and the mail Worker remain unchanged.

## Provider configuration

The PLAN.FLO operator configures each provider app once for the deployment. Each company administrator subsequently authorises their own mailbox or Xero organisation. Do not paste client secrets or tokens into chat, source code, setup forms, logs, or screenshots.

Gmail: enable the Gmail API, configure the OAuth consent screen/audience, and create a Web application OAuth client in Google Cloud. Register the exact return address shown in Set up Gmail (for staging: `https://staging.planflo.app/api/gmail/callback`). Configure `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REDIRECT_URI`, and `GMAIL_TOKEN_ENCRYPTION_KEY` through the approved hosting secret mechanism. The key must encode 32 random bytes in base64. Retain the existing key while encrypted connections exist. The requested scope is `https://www.googleapis.com/auth/gmail.readonly`; review Google's restricted-scope verification requirements for the intended audience before public activation. A readiness check verifies configuration presence/format, not Google's approval or credential validity.

Xero: create a standard OAuth2 Web app in the Xero developer portal. Register `https://staging.planflo.app/api/xero/callback` for staging (other deployments need their own exact return address). Configure `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REDIRECT_URI`, and a separate `XERO_TOKEN_ENCRYPTION_KEY` using the same secure hosting mechanism. Xero scopes are `offline_access payroll.employees.read payroll.settings.read`. Use an organisation with Australian payroll and an authorising user who can access it. The app uses the authorization-code flow with PKCE, a short-lived company/user-bound one-time state, company-bound AES-GCM token encryption, and serialized token refresh. It requests no payroll write scope.

## Company administrator flow

1. Settings → Integrations → Set up Gmail / Set up Xero shows what is configured and the exact callback address. Check setup again after the operator finishes configuration.
2. Connect Gmail opens Google consent. Authorise the intended invoice mailbox. Enable invoice checking explicitly after connection; existing review-before-cost and PO matching rules remain in place.
3. Connect Xero opens Xero consent. On return, explicitly select and link the intended organisation. One Xero organisation cannot be selected by two PLAN.FLO companies.
4. Save PLAN.FLO payroll employee profiles, then Load matching options in the Xero panel. Match employees, earnings rates and pay calendar, and save. Only IDs and display names are retained from employee responses; tax and banking data are not cached. Reconnecting or changing organisation clears old mappings.
5. Disconnect removes local tokens/matching and invalidates pending authorisation. For a selected organisation it also attempts to delete that Xero connection. If remote revocation fails (or no organisation was selected), the UI directs the user to remove remaining authorisation in Xero. Local payroll reviews remain intact.

Live account authorisation and provider configuration have not been performed by the local implementation tests. Tests use synthetic identities and mocked provider responses. Real Gmail ingestion and Xero payroll-read acceptance must follow explicit account approval. Payroll sending remains unavailable regardless of connection state.

## References

- [Xero maintained OAuth client and connection API](https://github.com/XeroAPI/xero-node/blob/master/src/XeroClient.ts)
- [Xero identity discovery](https://identity.xero.com/.well-known/openid-configuration)
- [Xero Australian payroll API and scopes](https://github.com/XeroAPI/Xero-OpenAPI/blob/master/xero-payroll-au.yaml)
- [Google Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)

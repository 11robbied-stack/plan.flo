# Signup human verification

Signup collects a full name, organisation/company, email, password, required phone and REC number. Invitees may omit organisation and REC; accepting an invitation still controls company membership. ABN and address remain in the verified-account company setup, not the signup form.

Create a Cloudflare Turnstile Managed widget restricted to the actual deployment hostname. Set TURNSTILE_SITE_KEY as a public Worker variable and TURNSTILE_SECRET_KEY as a Worker secret using the hosting dashboard. Do not commit the secret. Configure staging and production separately before deploying this change: new signups fail closed without both keys. Existing login and password recovery are unaffected.

The public /api/signup-verification endpoint exposes only the site key when configuration is present. The auth route validates each signup token through Siteverify and requires a successful response, the configured authentication hostname, and the signup action. Missing, expired, duplicate, invalid or unavailable verification rejects signup before account creation. The browser refreshes verification after an unsuccessful request. No production bypass exists.

Provider reference: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

Tests substitute synthetic browser widget code and a synthetic Siteverify transport at the test boundary. They do not contact Cloudflare or use real keys.

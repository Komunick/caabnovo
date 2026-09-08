# US1 secure access validation

Date: 2026-09-08
Scope: independent validation for US1 and success criteria SC-001/SC-002.

## Results

| Layer | Command | Result |
| --- | --- | --- |
| Authorization and administrative MFA policy | `corepack pnpm test:unit` | PASS — 2 files, 9 tests |
| `/api/v1/me` and OpenAPI contracts | `corepack pnpm test:contract` | PASS — 2 files, 5 tests |
| Better Auth and PostgreSQL sessions | `corepack pnpm test:integration` | PASS — 2 files, 6 tests |
| Login, MFA gate, logout, revocation and authorized navigation | `corepack pnpm exec playwright test auth-access.spec.ts --config=apps/web/playwright.config.ts` | PASS — 12/12 scenarios |
| Production build exercised by E2E web server | `next build` | PASS |

The E2E matrix executed the three independent access scenarios in Chromium, Firefox, WebKit and the
tablet profile. Test identities and credentials use only the reserved `.test` domain and synthetic
values. Authentication rate limiting is disabled only when `E2E_TEST_MODE=1`; the normal server
configuration keeps it enabled.

## SC-001 — deny unauthenticated or unauthorized actions

Status: PASS for the implemented US1 surface.

- The server guard denies a missing actor with `401` and a missing concrete permission with `403`.
- Unknown permission identifiers are discarded during role composition.
- `/api/v1/me` returns enumeration-safe `401`/`403` bodies without session, token, e-mail or internal
  permission details.
- A disabled user or revoked persisted session is rejected by the next protected database lookup.
- The navigation renders only links authorized by the current permission union; the server layout is
  the enforcement boundary and redirects an invalid session to login.

## SC-002 — administrative MFA before access

Status: PASS for the implemented US1 surface.

- TOTP enrollment remains pending until a valid code confirms it in PostgreSQL.
- Administrative policy requires both an enabled factor and a verified challenge.
- Better Auth issues no authenticated administrative navigation before the second-factor challenge.
- Trusted-device bypass is not used by the application; enrollment, verification and recovery
  requests force `trustDevice: false`.

## Security notes

- Session cache is disabled; protected actions resolve the current opaque session from PostgreSQL.
- The session cookie is `HttpOnly`, `SameSite=Strict` and `Secure` whenever the configured public URL
  uses HTTPS. Local HTTP E2E uses a non-secure synthetic cookie so WebKit can exercise the flow; the
  HTTPS integration test verifies the production attributes.
- Logout uses a JSON POST accepted by the authentication handler and revocation updates are observed
  on the next protected navigation.

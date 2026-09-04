# Authentication and Authorization Contract

## Session boundary

- Better Auth owns handlers below `/api/auth/*`; exact generated paths follow the pinned library
  release and are covered by integration tests.
- Sessions are opaque, persisted in PostgreSQL and transported only by `HttpOnly`, `Secure` cookies
  with the strictest practical `SameSite` policy.
- Stateless/JWT sessions and cookie session cache are disabled so revocation is effective on the next
  protected action.
- Every Server Action, Route Handler and application use case invokes a trusted session lookup and
  `requirePermission(resource, action)` before reading or mutating protected data.
- Mutation requests authenticated by cookie require CSRF protection and origin validation.

## MFA contract

1. A non-administrative user may enroll TOTP only after recent reauthentication.
2. TOTP becomes active only after a valid code confirms the pending secret.
3. Recovery codes are shown once, stored protected and rotated after use.
4. Granting an administrative role requires verified TOTP.
5. Login with an administrative role creates no authenticated session until the TOTP challenge
   succeeds; trusted-device bypass is disabled.
6. Removing the last verified factor from an administrator revokes administrative access and active
   sessions unless another verified factor satisfies policy.
7. Recovery and factor reset require an authorized, justified, audited process; support cannot bypass
   MFA.

## Authorization contract

Permission identifiers use `<resource>:<action>`, for example:

- `users:read`, `users:create`, `users:update`, `users:disable`
- `roles:read`, `roles:grant`, `roles:revoke`
- `audit:read`, `audit:export`
- `files:create`, `files:read`, `files:delete`
- `jobs:read`, `jobs:redrive`

Rules:

- Unknown permissions deny access.
- Multiple roles produce the union of currently active permissions; explicit superuser bypass does
  not exist.
- An actor cannot grant a permission outside the set they are authorized to manage.
- Resource ownership checks are additional to RBAC where relevant.
- `401` means no valid identity. `403` means a valid identity lacks access. `404` may replace `403`
  when revealing resource existence would disclose protected information.
- Denials are recorded as redacted security events; sensitive changes require justification and a
  business audit event.

## Required authorization tests

- Unauthenticated access for every protected operation.
- Horizontal access between two users with the same role but different resource ownership.
- Vertical access from ordinary user to administrator/auditor operations.
- Role composition, expiry and revocation during an active session.
- Disabled user and revoked session on the next request.
- Administrator without verified MFA.
- Attempted self-escalation and attempted grant beyond actor authority.
- Auditor read/export versus forbidden update/delete.

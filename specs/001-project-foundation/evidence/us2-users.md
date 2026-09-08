# US2 user administration validation

Date: 2026-09-08
Scope: independent validation for US2 and success criterion SC-005.

## Results

| Layer | Command | Result |
| --- | --- | --- |
| Access policy | `corepack pnpm test:unit` | PASS — 3 files, 14 tests |
| User and role contracts | `corepack pnpm test:contract` | PASS — 4 files, 10 tests |
| PostgreSQL transactions and concurrency | `corepack pnpm test:integration` | PASS — 3 files, 11 tests |
| User administration in Chromium, Firefox, WebKit and tablet | `corepack pnpm exec playwright test --config apps/web/playwright.config.ts user-administration.spec.ts` | PASS — 8/8 scenarios |
| Full authentication and user-administration regression matrix | `corepack pnpm test:e2e` | PASS — 20/20 scenarios |
| WCAG 2.2 AA checks on user list and detail | Included in `user-administration.spec.ts` | PASS — no violations in four profiles |
| Formatting | `corepack pnpm format:check` | PASS |
| Lint | `corepack pnpm lint` | PASS |
| TypeScript strict checks | `corepack pnpm typecheck` | PASS — all five workspace projects |
| Production build | `corepack pnpm build` | PASS — all five workspace projects and Next.js routes |

All identities, credentials, names, e-mail addresses and justifications used by the browser suite are
synthetic. Managed-user names and addresses are unique per scenario, while append-only security and
audit history is preserved between local executions.

## Atomicity and concurrency

Status: PASS.

- Repeating the same grant preserves a single active assignment.
- Concurrent attempts to revoke administrative access are serialized with an advisory lock: one
  revocation succeeds, the conflicting revocation returns `LAST_ADMIN_REQUIRED`, and one active
  administrator remains.
- A failed audit write rolls back a role grant; no assignment remains without its audit event.
- Account disablement, optimistic version increment and active-session revocation commit in one
  transaction together with the audit and redacted security events.
- A failed audit write rolls back both account disablement and session revocation, preserving the
  active account at its prior version.

## Denials and least privilege

Status: PASS.

- Policy tests reject expired or inverted validity windows, self-elevation, grants beyond the
  actor's authority, administrative grants without verified MFA, revocation without concrete
  authority and blank justifications.
- Contract tests distinguish malformed input (`422`) from optimistic or state conflicts (`409`).
- The server checks the concrete permission required by every mutation; hiding a navigation link is
  only a user-interface aid and is not the authorization boundary.
- An ordinary authenticated user sees no user-administration navigation and receives the safe denial
  page when requesting `/users` directly in every browser profile.
- Disabling an account revokes its active sessions, so its next protected request cannot continue.

## SC-005 — first-attempt completion within five minutes

Technical acceptance status: PASS. Formal human-participant acceptance remains to be recorded.

- The complete create, update, grant, revoke and disable journey succeeded on the first attempt in
  each of the four final browser profiles (4/4, 100%).
- Browser durations for that journey ranged from 6.0 to 10.1 seconds, below the five-minute target.
- These automated profiles exceed the 90% threshold as a repeatable technical proxy. Because SC-005
  explicitly refers to participating administrators, final usability sign-off still requires real
  administrators to run the same journey and record their first-attempt outcome and elapsed time.

## Local acceptance setup

The development server uses `E2E_TEST_MODE=1` only in the ignored local environment file so repeated
synthetic sign-ins are not rate-limited and the test-only session-revocation route is available. This
setting is not part of tracked production configuration.

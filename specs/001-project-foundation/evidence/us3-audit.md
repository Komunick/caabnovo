# US3 audit investigation validation

Date: 2026-09-08
Scope: independent validation for US3 and success criteria SC-003/SC-004.

## Results

| Layer | Command | Result |
| --- | --- | --- |
| Audit query/export contracts | `corepack pnpm test:contract` | PASS — 5 files, 13 tests |
| PostgreSQL immutability, filtering, rollback and export idempotency | `corepack pnpm test:integration` | PASS — 4 files, 18 tests |
| Auditor journey and unauthorized denial in Chromium, Firefox, WebKit and tablet | `corepack pnpm exec playwright test --config apps/web/playwright.config.ts audit.spec.ts` | PASS — 8/8 scenarios |
| WCAG 2.2 AA scan of the audit page | Included in `audit.spec.ts` | PASS — no Axe violations in four profiles |

All event identifiers, users, credentials, filters and justifications are synthetic. The E2E setup
only appends known synthetic audit records; it does not remove or rewrite prior audit history.

## SC-003 — complete, searchable and immutable audit trail

Status: PASS for every critical mutation implemented through US3.

- User creation, update, disablement, role grant/revocation, export request and export completion
  produce allowlisted audit events in the same transaction as their database state change.
- A deliberately failing audit insert rolls back its paired user/role mutation and its export job
  request, including the idempotency claim and queue insertion.
- The runtime role can only `SELECT` and `INSERT` audit records. PostgreSQL rejects application-level
  `UPDATE` and `DELETE` attempts, independently of the read-only UI.
- Combined actor/action/entity/time filters and stable cursor pagination return known events through
  both repository and HTTP contract tests.
- Repeating an equivalent export request returns the original job without enqueueing or auditing it
  twice. Repeating a completed worker job does not upload, register or audit a second artifact.
- pg-boss schema version 40 is provisioned by a reviewed migration in an isolated schema owned by the
  runtime role; web and worker startup do not receive DDL privileges over the application schema.

## SC-004 — no unnecessary sensitive data in audit samples

Status: PASS for the US3 audit and export surfaces. The final cross-system log/error canary remains
tracked by T086.

- Snapshot redaction replaces password and token canaries with `[REDACTED]` before persistence and
  applies the same allowlist again when records are queried or exported.
- The private JSONL export integration test finds the expected synthetic event but no password or
  token canary, and verifies exactly one `private` stored-file record.
- HTTP errors expose stable safe codes/messages and request IDs; contract tests verify 401/403/422
  behavior without returning session or internal authorization details.
- Export downloads use a five-minute signed URL for the private bucket and are only generated for an
  actor with `audit:export`.

## Acceptance notes

- The authorized browser journey completed in every final browser profile; direct audit access and
  export remained denied to the ordinary authenticated user.
- Worker execution against a live S3-compatible service is covered by the broader US5 operational
  validation; US3 proves the job payload, private artifact, redaction and repeat behavior with a real
  PostgreSQL database and a controlled S3 command boundary.

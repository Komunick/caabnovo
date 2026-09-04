# Quickstart Validation Guide: Fundação do Sistema CAAB

Este guia descreve a validação esperada depois da implementação. Os comandos são contratos do plano;
eles serão materializados pelas tarefas de implementação.

## Prerequisites

- Git repository with protected `dev` and `main` branches.
- Node.js 24 LTS and Corepack/pnpm.
- Docker-compatible runtime for PostgreSQL, S3-compatible storage, ClamAV and test containers.
- Local `.env` derived from `.env.example`, containing only development credentials.
- No production secrets or real personal data.

## Repository flow

```powershell
git switch dev
git pull --ff-only
git switch -c feature/project-foundation
```

All work from this branch must enter through a Pull Request to `dev`. A later production promotion
must be a human-approved Pull Request from `dev` to `main`; direct pushes remain blocked.

## Local setup

```powershell
corepack enable
pnpm install --frozen-lockfile
docker compose up -d postgres storage clamav otel-collector
pnpm db:migrate
pnpm db:seed:dev
pnpm dev
```

Expected outcome:

- Web and worker become ready without creating schema at runtime.
- `/livez` responds when the web process is alive.
- `/readyz` succeeds only when required dependencies are usable.
- Seed data contains synthetic users, roles and permissions only.

## Gate suite

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:contract
pnpm test:e2e
pnpm test:a11y
pnpm build
pnpm security:scan
```

Every command must exit successfully before a Pull Request can merge. Contract validation regenerates
OpenAPI and fails if [openapi.yaml](./contracts/openapi.yaml) drifts from runtime schemas.

## Scenario 1: Authentication and MFA

1. Sign in with an active ordinary test user and confirm only permitted navigation/actions appear.
2. Call a forbidden operation directly and confirm safe `403`, no protected data and a security event.
3. Sign in with an administrator test user; confirm no authenticated administrative session exists
   before a valid TOTP challenge.
4. Revoke the session and repeat the next protected request; confirm immediate `401`.
5. Disable the user and confirm all sessions are revoked.

Expected evidence: automated tests for SC-001/SC-002, redacted security events and no session cache.

## Scenario 2: Roles and least privilege

1. Create a synthetic user with a non-administrative role and justification.
2. Verify the user receives exactly the role's active permissions.
3. Attempt to grant a permission the acting administrator cannot manage; confirm denial.
4. Grant then revoke an allowed role and confirm the next request observes the change.
5. Attempt to remove/disable the last active administrator; confirm conflict and preserved access.

Expected evidence: user/role changes and audit events commit atomically; no self-escalation is possible.

## Scenario 3: Append-only audit

1. Perform representative critical changes for users, roles, files and job redrive.
2. Search by actor, action, entity and period as an auditor.
3. Try UPDATE and DELETE using the runtime database role; both must fail at database level.
4. Force audit insertion failure in an integration test; confirm the critical mutation rolls back.
5. Scan audit, application logs and errors for seeded secrets/PII canaries; none may appear.

Expected evidence: SC-003/SC-004 pass and each event carries request/correlation IDs.

## Scenario 4: Secure file lifecycle

1. Request an upload intent as an authorized user and upload to quarantine.
2. Finalize with the expected checksum and observe queued scan progress.
3. Confirm download remains denied until type/signature/size and antivirus checks pass.
4. Upload a MIME-mismatch sample, an antivirus test file and an oversized file; all remain unavailable.
5. Stop ClamAV and retry; status becomes retryable/error and never `available`.

Expected evidence: only clean files transition to `available`; private download URLs are short-lived
and authorized. See [data-model.md](./data-model.md) for transitions.

## Scenario 5: Job idempotency and observability

1. Submit the same idempotency key and fingerprint concurrently.
2. Confirm one domain job/effect and a stable status reference.
3. Simulate a retryable failure; confirm finite retries, monotonic progress and correlation continuity.
4. Exhaust retries; confirm safe terminal failure and visible queue age/depth metrics.
5. Redrive as an authorized operator with justification; confirm audit and no duplicate business effect.

Expected evidence: SC-007/SC-010 pass and the [jobs contract](./contracts/jobs.md) is honored.

## Scenario 6: Accessibility and responsiveness

1. Complete login, MFA, navigation, user administration and audit search using keyboard only.
2. Run automated Axe checks on each essential page and important error/loading state.
3. Manually verify focus order/visibility, accessible names, contrast, zoom/reflow and a screen reader.
4. Check that no state is communicated by color or icon alone and all UI icons use Lucide React.
5. Repeat essential flows at supported desktop and tablet widths.

Expected evidence: SC-008 passes with automated report plus signed manual checklist.

## Branch protection validation

Verify repository rules before merging:

- `dev`: PR required, at least one human review, resolved conversations, current branch, unique
  required checks, no direct/force push or deletion, rules applied to administrators.
- `main`: update restricted to maintainers, PR head must be `dev`, CODEOWNER/maintainer approval,
  complete gates, no automated bypass and no force push/deletion.
- CI rejects a PR to `main` whose head is not `dev`.

Expected evidence: SC-009 passes, including a deliberately blocked direct push and invalid promotion.

## Privacy and retention validation

1. Confirm the Jurídico/DPO-approved inventory lists every personal-data category, purpose, access,
   retention period, disposal/anonymization action and legal-preservation exception.
2. Run retention with synthetic expired data and confirm the approved action and audit evidence.
3. Apply a legal-preservation exception and confirm disposal is blocked and escalated without data
   loss.
4. Confirm no production promotion is possible while the policy, approval or automated controls are
   missing.

Expected evidence: FR-030 passes without inventing a retention period in code or configuration.

## Final acceptance

The Foundation is ready for merge to `dev` only when:

- All commands in the gate suite pass from a clean checkout.
- All scenarios above have retained evidence.
- The approved permission matrix and ASVS v5.0.0 L2 evidence matrix are attached to the PR.
- The personal-data inventory and retention/disposal policy are approved by Jurídico/DPO, their
  controls pass with synthetic data and unresolved items block production promotion.
- Security/privacy-sensitive changes have a named human reviewer.
- Rollback and migration notes contain no destructive shortcut or real personal data.

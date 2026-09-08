# Final clean-checkout validation

Date: 2026-09-08

Status: PASS on commit `220b7e1`.

The candidate was cloned into a new directory, installed with the frozen lockfile and exercised with
an ignored local `.env` containing only synthetic development credentials. PostgreSQL, MinIO,
ClamAV and the OpenTelemetry collector were running locally. A Windows/Node `os.userInfo()` failure
in the workstation was isolated with a process-only `NODE_OPTIONS` shim; no workaround was added to
the repository.

## Bootstrap and runtime

- `pnpm install --frozen-lockfile`: PASS; 518 packages restored and supply-chain policy accepted all
  669 lockfile entries.
- `pnpm db:migrate`: PASS against an isolated database; all 6 migrations were present.
- `pnpm db:seed:dev`: PASS and repeat-safe; 4 synthetic users and a single baseline audit fixture.
- Web production start and worker start: PASS.
- `/livez`: HTTP 200.
- `/readyz`: HTTP 200 with database ready and worker heartbeat present.

## Gate suite

- `pnpm format:check`: PASS.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS for config, contracts, database, web and worker.
- `pnpm test:unit`: PASS, 9 files and 28 tests.
- `pnpm test:integration`: PASS, 7 files and 30 tests using disposable PostgreSQL containers.
- `pnpm test:contract`: PASS, 6 files and 16 tests, including deterministic OpenAPI validation.
- `pnpm test:e2e`: PASS, 68/68 across Chromium, Firefox, WebKit and tablet.
- `pnpm test:a11y`: PASS, 20/20 across the same four browser profiles.
- `pnpm build`: PASS for every workspace; Next.js generated all 17 routes/pages.
- `pnpm security:scan`: PASS at the high-severity gate; 1 low and 2 moderate advisories, with zero
  high or critical advisories.

## Operational scenario

The final commit also completed a real secure-file cycle against MinIO and ClamAV: authenticated
login 200, upload intent 201, signed quarantine PUT 200, finalize 202, asynchronous scan succeeded,
private download grant 200 and 68-byte payload download 200. This caught and fixed premature TCP
half-close behavior in the ClamAV `INSTREAM` client before this evidence was recorded.

T094 is complete. T087 (approved k6 profile), T089 (Jurídico/DPO approval and retention controls) and
T095 (remote repository ruleset application/probes) remain independent acceptance items.

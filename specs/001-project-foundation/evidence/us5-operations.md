# US5 resilient operations validation

Date: 2026-09-08
Scope: independent validation for US5 and success criteria SC-007/SC-010.

## Results

| Layer | Command | Result |
| --- | --- | --- |
| Job/file state machines, ClamAV protocol and safe errors | `corepack pnpm test:unit` | PASS — 7 files, 25 tests |
| Upload, finalize, download and job HTTP contracts | `corepack pnpm test:contract` | PASS — 6 files, 16 tests |
| PostgreSQL concurrency/retry/heartbeat plus file inspection | `corepack pnpm test:integration` | PASS — 6 files, 27 tests |
| Operational UI, authorized redrive and private quarantine in all profiles | `corepack pnpm exec playwright test` from `apps/web` | PASS — 68/68 scenarios |
| Static and production validation | `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm build` | PASS |

All identifiers, credentials, files, failure messages and redrive reasons used by the automated
validation are synthetic. Scanner failures are represented by controlled protocol servers or rejected
connections; no real malware or personal data is used.

## SC-007 — retry without duplicate business effects

Status: PASS for all retry/idempotency paths implemented in US5.

- Six concurrent attempts to create the same logical job collapse to one `job_execution` identifier
  and exactly one successful insert through the database unique constraint.
- A failed execution stores only the allowlisted `JOB_FAILED` result, preserves the attempt count,
  accepts one authorized redrive while attempts remain and completes on attempt two with monotonic
  progress at 100%.
- Upload intent retries use a request fingerprint. An equivalent idempotency key returns the original
  file; using the same key for different metadata returns a conflict.
- Finalize locks the file row, creates the domain job and enqueues pg-boss in the same transaction.
  Repeated finalize calls return the existing job instead of duplicating the scan.
- File scan claims only `uploaded`, `scan_error`, or stale `scanning` records. Promotion checks both DB
  and object-storage state before copying and can safely resume after a partial storage/DB failure.
- The reconciler repairs clean files left between quarantine and the private bucket and reports objects
  missing from both locations.

## SC-010 — affected area and correlation visible within five minutes

Status: PASS for every component/job failure simulated by US5.

- The job detail page immediately identifies the job type, safe terminal state, attempt count and
  correlation identifier. Active pages refresh every two seconds.
- Scanner unavailability always moves the file to `scan_error`, increments the bounded scanner metric,
  fails the tracked attempt safely and never exposes a download URL.
- `/readyz` distinguishes database failure from a missing/stale worker heartbeat and returns 503 while
  `/livez` remains available for process liveness.
- Bounded OpenTelemetry metrics and spans cover HTTP latency/errors, jobs, queues, scanner and storage.
  Prometheus rules alert on API latency/error rate, queue backlog, scanner unavailability, repeated
  storage errors and absent worker readiness.
- E2E confirms the operator can open a failed job, see 45% progress and its correlation identifier,
  submit a justified authorized redrive, and immediately observe the queued state in Chromium,
  Firefox, WebKit and tablet profiles.

## File safety evidence

- A quarantined object cannot receive a download grant before `available`; the API returns 409.
- MIME declaration, detected magic bytes and filename extension must agree and be allowlisted.
- Actual size, declared size and SHA-256 checksum must match before antivirus scanning.
- Infected content is rejected; an unavailable scanner returns a retry disposition and fails closed.
- Upload and private download URLs expire after five minutes. The quarantine and private buckets remain
  non-public, and promotion removes the quarantine copy after the private copy succeeds.

## Regression note

The first complete E2E pass exposed one pre-existing hydration delay that left the audit export trigger
disabled on tablet under load (67/68). The trigger did not require client-only state, so that artificial
disablement was removed. The targeted tablet test then passed, followed by a clean full run of 68/68.

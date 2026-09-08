# SC-006 performance validation

Date: 2026-09-08

## Approved local operating profile

The repository administrator authorized continuation with the initial local profile proposed for
SC-006: at most 5 concurrent virtual users against the isolated local stack. The main workload runs
for 1 minute. After it finishes, the same number of virtual users performs one MFA validation each;
the scenarios do not overlap.

This is a foundation acceptance baseline, not a capacity test or a production forecast. Production
endpoints, credentials and personal data are prohibited.

## Environment and synthetic data

- Next.js production build on Windows, exposed locally at `http://localhost:3100`.
- PostgreSQL 18 running in the local Docker Compose stack.
- Official `grafana/k6:latest` container, with the test mounted read-only.
- `E2E_TEST_MODE=1` was limited to the local process so application-level authentication throttling
  would not distort the response-time baseline.
- Seeded `manager@example.test` and `admin@example.test` identities, synthetic passwords,
  generated `example.test` users and the non-administrative `user-viewer` role.
- Every generated user and permission change includes a synthetic justification and remains auditable
  in the disposable local database.

## Scenario

The executable scenario is `apps/web/tests/performance/foundation.k6.ts`. It measures each required
journey independently and enforces `p(95) < 2000 ms` for login, MFA validation, authenticated
navigation, user listing, user creation, permission grant and audit search. Functional checks must
also pass at a rate of 100%.

MFA is validated by obtaining a real administrative challenge and submitting an intentionally invalid
TOTP. Each of the five VUs performs this once. This proves the endpoint rejects invalid verification
safely without turning the performance run into an account-lockout test. The five expected 401
responses therefore appear in k6's generic `http_req_failed` metric, while their explicit functional
checks pass.

Reusable execution command (credentials supplied only through the local environment):

```powershell
docker run --rm -v "${PWD}:/work:ro" `
  -e K6_BASE_URL=http://host.docker.internal:3100 `
  -e K6_ORIGIN=http://localhost:3100 `
  -e K6_USER_EMAIL -e K6_USER_PASSWORD `
  -e K6_ADMIN_EMAIL -e K6_ADMIN_PASSWORD `
  -e FOUNDATION_VUS=5 -e FOUNDATION_DURATION=1m `
  grafana/k6:latest run /work/apps/web/tests/performance/foundation.k6.ts
```

## Result

Status: **PASSED**

| Journey | p95 | Limit | Result |
| --- | ---: | ---: | --- |
| Login | 298.67 ms | 2,000 ms | PASS |
| MFA validation | 74.16 ms | 2,000 ms | PASS |
| Authenticated navigation | 137.17 ms | 2,000 ms | PASS |
| User listing | 54.45 ms | 2,000 ms | PASS |
| User creation | 96.65 ms | 2,000 ms | PASS |
| Permission grant | 64.81 ms | 2,000 ms | PASS |
| Audit search | 52.54 ms | 2,000 ms | PASS |

The run completed 220 iterations (215 main workload iterations plus 5 MFA iterations), with 1,520 of
1,520 checks passing and no interrupted iteration. Maximum observed concurrency was 5 VUs because the
two scenarios ran sequentially. All seven SC-006 latency thresholds passed with substantial margin.

An earlier diagnostic run repeated invalid TOTP submissions in every main iteration. It correctly
triggered Better Auth's 10-failure, 15-minute administrative lockout and failed the functional check.
The scenario was corrected to isolate MFA validation as described above; the lockout itself was not
weakened or bypassed in application code.

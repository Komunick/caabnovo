# SC-006 performance validation

Date: 2026-09-08

## Approved test profile required

The executable k6 scenario is available at
`apps/web/tests/performance/foundation.k6.ts`. It measures login, MFA-page response, authenticated
navigation, user listing/creation, role grant and audit search with individual `p(95) < 2000 ms`
thresholds and a 100% response check threshold.

Default proposed local profile: 5 concurrent virtual users for 1 minute against the isolated local
stack. Inputs are synthetic users, `example.test` addresses, synthetic justifications and an explicitly
selected non-administrative role. No production endpoint, credential or personal data is permitted.

## Execution status

Status: PENDING — k6 is not installed on the current workstation, and the operational load profile has
not yet received human approval. T087 remains open until both conditions are satisfied and a real k6
summary demonstrating every p95 threshold is attached here.

Suggested execution after approval:

```powershell
k6 run -e K6_BASE_URL=http://localhost:3000 `
  -e K6_USER_EMAIL=<synthetic-manager> `
  -e K6_USER_PASSWORD=<local-test-password> `
  -e K6_ROLE_ID=<synthetic-non-admin-role-id> `
  apps/web/tests/performance/foundation.k6.ts
```

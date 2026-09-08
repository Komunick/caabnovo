# Foundation validation evidence

Date: 2026-09-08
Scope: T028 only; the full clean-checkout quickstart remains reserved for T094.

## Environment

- Node.js: `v24.20.0`
- pnpm: `11.25.0`
- PostgreSQL harness: Testcontainers with `postgres:18-alpine`
- Test runner: Vitest `4.1.11`

## Results

| Gate | Command | Result |
| --- | --- | --- |
| Migrations from an empty database | `corepack pnpm test:integration` | PASS — 1 file, 2 tests |
| Runtime append-only privileges | `corepack pnpm test:integration` | PASS — runtime `UPDATE` and `DELETE` both rejected with PostgreSQL code `42501` |
| OpenAPI 3.1.1 validation and determinism | `corepack pnpm test:contract` | PASS — 1 file, 2 tests |
| Formatting | `corepack pnpm format:check` | PASS |
| Lint | `corepack pnpm lint` | PASS |
| TypeScript strict checks | `corepack pnpm typecheck` | PASS — all five workspace projects |

The integration run applied `0001_identity.sql` through `0005_operations.sql` to a fresh ephemeral
database. The contract test normalized the checked-in OpenAPI document twice and confirmed identical
output, while also verifying rejection of an unversioned public server URL.

## Harness correction

Vitest project excludes explicitly ignore nested `node_modules` directories. This prevents workspace
dependency test suites from being collected when a project-specific gate is run.

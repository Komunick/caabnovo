# Final API contract validation

Date: 2026-09-08

The OpenAPI 3.1.1 contract was regenerated with `corepack pnpm contracts:generate` after the final
file/job implementation. The generator now resolves the repository contract independently of the
package-manager working directory.

## Result

- `corepack pnpm exec vitest run --project contract packages/contracts/tests/openapi.test.ts`:
  PASS — 1 file, 2 tests.
- YAML parsing and the required versioned `/api/v1` server passed.
- Normalizing the generated output twice produces byte-identical content.
- The final contract includes upload intent, finalize, authorized private download, job status and
  justified job redrive.
- Upload MIME allowlisting and the 25 MiB maximum match the authoritative Zod contracts and worker
  inspection policy.

Status: no known drift between the implemented public foundation routes, Zod schemas and OpenAPI
surface.

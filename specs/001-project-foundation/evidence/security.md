# Foundation security validation

Date: 2026-09-08

## Automated scans

- SAST baseline: `corepack pnpm lint` passed. A supplemental local source scan found zero uses of
  `eval`, `new Function`, `dangerouslySetInnerHTML`, child-process execution or interpolated SQL
  statement patterns in `apps/` and `packages/`.
- Secret scan: a local, content-safe scan of the working tree and every Git revision found zero files
  matching AWS access keys, GitHub tokens, OpenAI-style secret tokens or private-key headers. The CI
  retains the pinned `zricethezav/gitleaks:v8.28.0` full-history scan with `--redact`.
- Dependency scan: `corepack pnpm security:scan` passed its high-severity gate with zero high and zero
  critical advisories.
- Redaction canaries: 5/5 tests passed for password, token, cookie, stack and unnecessary PII.

## Dependency findings and treatment

The initial audit found one direct moderate advisory in `yaml 2.8.1`; the direct dependency was updated
to `2.8.3` and contracts were revalidated. The remaining audit inventory is two moderate and one low:

- Moderate `yaml 2.8.1` is transitively owned by Testcontainers' Docker Compose parser and is used only
  by the development/integration test toolchain.
- Moderate `esbuild 0.18.20` is pulled by deprecated drizzle-kit loader tooling. The vulnerable feature
  is its development server, which the CAAB application does not launch or expose.
- Low `esbuild 0.27.7` affects local Windows development-server file access in Vitest/tsx tooling; CI
  runs isolated and development servers must remain bound to trusted local interfaces.

No forced incompatible override was applied. These findings remain visible in `pnpm audit`; the CI
fails if a high/critical advisory appears, and upgrades of Testcontainers/drizzle tooling should remove
the transitive paths when compatible releases are available.

## ASVS review

The ASVS v5 L2 foundation matrix was updated with implemented evidence. Authentication, session,
authorization, validation, logging, malicious-file handling, business logic, uploads, API and code
configuration controls are covered by automated evidence. Production remains blocked on the two
explicit human/environment controls: Jurídico/DPO approval of retention (V8) and verification of TLS
termination/deployment configuration (V6/V9).

## Tooling note

Running a newly downloaded third-party gitleaks container against the whole repository was rejected by
the execution safety policy because it would mount Git history into an untrusted image. The safer local
pattern scan was used in this run; the repository's established CI action remains the authoritative
gitleaks execution.

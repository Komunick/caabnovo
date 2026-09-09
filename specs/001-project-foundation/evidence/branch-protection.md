# Branch protection validation

Date: 2026-09-09

Status: DEV RULESET ACTIVE AND VERIFIED. MAIN OUT OF SCOPE.

## Authorized scope

The repository owner limited this delivery to `dev` and authorized its PR integration, ruleset
application and verification. `main` is excluded: its versioned ruleset is restored to the PR base,
its remote settings will not be changed and no production promotion will be opened or merged.
T095 remains partially open because its original scope also includes `main` and promotion probes.

## Remote baseline

Read-only inspection on 2026-09-09 returned no repository rulesets. Legacy `dev` protection requires a
PR, zero approving reviews, stale-review dismissal and resolved conversations, includes administrators,
and blocks force-push/deletion. It has no required status checks.

Checks on commit `8eaff64` confirmed `quality`, `browser` and `security`, all successful and emitted by
GitHub Actions (App ID `15368`). These three checks are required by the prepared `dev` ruleset, with
strict up-to-date checking and no bypass actors. Existing legacy protection is preserved.

## Implementation and validation

- `apply-rulesets.ps1` defaults to a read-only preview and accepts `-Apply` for the single `dev` write.
  `-Apply -WhatIf` is also read-only. There is no option to select another branch.
- It resolves paginated repository-owned rulesets, rejects duplicate names, inspects an existing
  target before updating and rejects targets other than exactly `refs/heads/dev` without exclusions.
- API failures stop execution. Versioned JSON is sent with `--input`, without shell-built JSON or stdin
  encoding conversion. Rerunning after successful application updates the existing ID.
- The test replaces `gh` only inside its process and never contacts GitHub. It covers preview,
  creation, paginated update, WhatIf, API read/write failures, duplicate names, required checks and
  rejection of existing main/mixed/wildcard targets. It runs in CI's `quality` job under PowerShell Core.
- Local Windows PowerShell test: PASS, nine scenario groups (including three disallowed target cases).

API reference: [GitHub repository rulesets](https://docs.github.com/en/rest/repos/rules).

## DEV maintenance commands

Run from the repository root. On Windows PowerShell, replace `pwsh -File` with
`powershell -NoProfile -ExecutionPolicy Bypass -File`.

```powershell
pwsh -File infra/github/test-rulesets.ps1
pwsh -File infra/github/apply-rulesets.ps1
pwsh -File infra/github/apply-rulesets.ps1 -Apply -WhatIf
pwsh -File infra/github/apply-rulesets.ps1 -Apply
gh api repos/Komunick/caabnovo/rulesets
gh api repos/Komunick/caabnovo/rules/branches/dev
```

## Applied remote state

- [PR #8](https://github.com/Komunick/caabnovo/pull/8) merged into `dev` as `e3249d5` on
  2026-09-09 at 11:33:20 UTC, after `quality`, `browser` and `security` passed on both branch and PR
  executions for candidate `e5a1405`.
- The authorized application created [Protect dev](https://github.com/Komunick/caabnovo/rules/22635784),
  ruleset ID `22635784`, at 11:33:39 UTC. The script reported `Applied: True`.
- Read-back of that ID confirms active enforcement, the sole target `refs/heads/dev`, no exclusions,
  no bypass actors and `current_user_can_bypass: never`.
- The effective branch-rules endpoint confirms deletion and force-push protection, PR required with
  zero approving reviews, stale-review dismissal, resolved conversations and strict required checks
  `quality`, `browser`, `security`, each bound to GitHub Actions App ID `15368`.
- A subsequent read-only script invocation identified that same ID and planned `PUT`, with
  `Applied: False`; it neither created a duplicate ruleset nor changed any remote setting.
- No `main` settings, files relative to the PR base, refs or promotion workflows were modified.

The configured DEV rules have been verified through the API. No direct-push probe was performed:
the project's delivery policy prohibits direct pushes to `dev`, and an attempted write could succeed
if protections are misconfigured. A dry-run push is not server-enforcement evidence. That probe and
the excluded `main`/promotion criteria remain open in the original T095 scope.

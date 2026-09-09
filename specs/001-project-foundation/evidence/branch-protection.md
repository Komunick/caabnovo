# Branch protection validation

Date: 2026-09-09

Status: PENDING RULESET APPLICATION AND DESTRUCTIVE-PROBE APPROVAL.

## Current remote state (read-only verification)

- Repository rulesets: none (`GET /repos/Komunick/caabnovo/rulesets` returned `[]`).
- Legacy `dev` protection: PR required, zero approving reviews, stale reviews dismissed, conversations
  resolved, administrators included, force-push/deletion disabled. No required status checks were
  reported.
- Legacy `main` protection: PR required, one approving review, last-push approval, stale reviews
  dismissed, conversations resolved, administrators included, force-push/deletion disabled. No
  required status checks were reported.

The versioned target for `dev` was aligned with the repository owner's explicit decision: pull request
is mandatory, but a separate approving reviewer is not. The `main` target retains one human review.

## Prepared controls and local validation

The read-only API inspection was repeated on 2026-09-09: no repository rulesets exist and the legacy
protections above remain active. The checks on commit `8eaff64` confirm `quality`, `browser` and
`security`, all successful and emitted by GitHub Actions (App ID `15368`).

- Both versioned rulesets now require `quality`, `browser` and `security` from that App ID.
- `main` additionally requires `validate-source`, the job in `promotion.yml` that rejects a source
  other than `dev` and blocks promotion while privacy approval is pending. This job name is checked
  against the workflow locally; it has not yet been demonstrated on a promotion PR.
- `apply-rulesets.ps1` now defaults to a read-only preview. Remote writes require `-Apply`; `-WhatIf`
  remains read-only even with that switch. Existing legacy protections are not removed.
- The script resolves all pages of repository-owned rulesets and parses both payloads before writing.
  Duplicate names stop the plan; failed API calls stop execution instead of reporting success.
- JSON is passed through `--input` using the versioned file, avoiding PowerShell quoting and stdin
  encoding issues. If a later write fails, an earlier successful write remains applied; rerunning
  updates existing IDs rather than creating duplicate rulesets.

`powershell -NoProfile -ExecutionPolicy Bypass -File infra/github/test-rulesets.ps1`: PASS, eight
scenarios covering preview, creation, paginated updates, WhatIf, read failure, write failure,
ambiguity and required workflow/provider gates. The test replaces `gh` inside the test process and
never contacts GitHub. It is also included in the CI `quality` job using PowerShell Core.

The real read-only preview passed and reported `POST` for both branches, with `Applied: False` and
the expected required checks. No rulesets or branch protections were changed by this validation.

API reference: [GitHub repository rulesets](https://docs.github.com/en/rest/repos/rules).

## Remaining validation

T095 stays open. After review, a maintainer can run these commands from the repository root
(`powershell -ExecutionPolicy Bypass -File` can replace `pwsh -File` on Windows PowerShell):

```powershell
pwsh -File infra/github/test-rulesets.ps1
pwsh -File infra/github/apply-rulesets.ps1
pwsh -File infra/github/apply-rulesets.ps1 -Apply -WhatIf
pwsh -File infra/github/apply-rulesets.ps1 -Apply
gh api repos/Komunick/caabnovo/rulesets
gh api repos/Komunick/caabnovo/rules/branches/dev
gh api repos/Komunick/caabnovo/rules/branches/main
```

Before application, review the exact JSON files and ensure a second eligible human can approve
production promotions: `main` requires a code-owner review and approval of the most recent push.
Do not add bypass actors or remove legacy protections to make a check pass.

After application, record the returned ruleset IDs and effective rules, demonstrate blocked direct
pushes and rejection of a non-`dev` promotion in an explicitly authorized probe, and confirm the
required `validate-source` check actually reports on a promotion PR. Do not merge into `main` as part
of these probes. A dry-run push is not evidence that GitHub enforces server-side rules.

# Branch protection validation

Date: 2026-09-08

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

## Remaining validation

Applying rulesets would overlap with or replace active legacy protections and can lock repository
updates if check names or actor rules are wrong. It was not performed implicitly while the working
copy contains uncommitted implementation and commits were explicitly postponed. A direct-push probe
also requires creating/pushing a disposable commit and was therefore not attempted.

T095 remains open until an authorized maintenance window applies the reviewed rulesets, verifies the
actual CI check names, demonstrates a blocked direct push and demonstrates that a non-`dev` PR to
`main` is rejected without bypassing repository protections.

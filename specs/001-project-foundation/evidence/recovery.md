# PostgreSQL backup, restore and migration recovery

Date: 2026-09-08

## Validation result

Status: PASS.

- `infra/postgres/backup.ps1` created a custom-format backup from the local `caab` database.
- Backup size: 165,506 bytes.
- `infra/postgres/restore.ps1` restored it into the new isolated database
  `caab_restore_20260908_cc466c01`.
- Restored validation: 6 migration records and 16 public tables.
- Source and restored databases both contained exactly 6 migration records.
- The source database was never dropped, truncated, overwritten or selected as a restore target.
- The temporary host backup file was removed after validation; the isolated restored database remains
  available for human inspection and must be dropped manually when no longer needed.

## Safe rollback strategy

Applied migrations are forward-only and are never rewritten. If an application release must be
rolled back after an additive migration, deploy the previous compatible application while retaining
the expanded schema. If the database itself must be recovered, restore the pre-deploy backup into a
new database, validate migration/table counts and application smoke tests there, then switch the
application connection deliberately. Do not run destructive down migrations or overwrite the source
database as a shortcut.

Both scripts refuse unsafe targets: restore rejects the source database, requires a dedicated
`caab_restore_*` name and refuses to overwrite an existing database.

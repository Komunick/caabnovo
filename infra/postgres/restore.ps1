[CmdletBinding()]
param(
  [string]$Container = "caab-foundation-postgres-1",
  [string]$SourceDatabase = "caab",
  [string]$DatabaseUser = "postgres",
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,
  [Parameter(Mandatory = $true)]
  [ValidatePattern("^caab_restore_[a-z0-9_]+$")]
  [string]$TargetDatabase
)

$ErrorActionPreference = "Stop"
if ($TargetDatabase -eq $SourceDatabase) {
  throw "Refusing to restore over the source database"
}
$resolvedBackup = [System.IO.Path]::GetFullPath($BackupPath)
if (-not (Test-Path -LiteralPath $resolvedBackup -PathType Leaf)) {
  throw "Backup file not found: $resolvedBackup"
}
$containerPath = "/tmp/caab-restore-$([guid]::NewGuid().ToString('N')).dump"

try {
  $exists = & docker exec $Container psql --username=$DatabaseUser --dbname=postgres --tuples-only --no-align --command="SELECT 1 FROM pg_database WHERE datname = '$TargetDatabase'"
  if ($LASTEXITCODE -ne 0) { throw "Unable to inspect target database" }
  if (("$exists").Trim() -eq "1") { throw "Refusing to overwrite existing database $TargetDatabase" }

  & docker cp $resolvedBackup "${Container}:${containerPath}"
  if ($LASTEXITCODE -ne 0) { throw "docker cp failed with exit code $LASTEXITCODE" }
  & docker exec $Container createdb --username=$DatabaseUser $TargetDatabase
  if ($LASTEXITCODE -ne 0) { throw "Unable to create validation database" }
  & docker exec $Container pg_restore --username=$DatabaseUser --dbname=$TargetDatabase --exit-on-error --no-owner $containerPath
  if ($LASTEXITCODE -ne 0) { throw "pg_restore failed with exit code $LASTEXITCODE" }

  $summary = & docker exec $Container psql --username=$DatabaseUser --dbname=$TargetDatabase --tuples-only --no-align --command="SELECT (SELECT count(*) FROM caab_schema_migration) || ':' || (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public')"
  $summaryText = ("$summary").Trim()
  if ($LASTEXITCODE -ne 0 -or -not $summaryText) { throw "Restored database validation failed" }
  Write-Output "Restore validated in $TargetDatabase (migrations:tables=$summaryText)"
  Write-Output "The source database was not modified. Drop the validation database manually after review."
}
finally {
  & docker exec $Container rm -f $containerPath 2>$null | Out-Null
}

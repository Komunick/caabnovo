[CmdletBinding()]
param(
  [string]$Container = "caab-foundation-postgres-1",
  [string]$Database = "caab",
  [string]$DatabaseUser = "postgres",
  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = "Stop"
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
$parent = Split-Path -Parent $resolvedOutput
if (-not (Test-Path -LiteralPath $parent)) {
  New-Item -ItemType Directory -Path $parent | Out-Null
}
$containerPath = "/tmp/caab-backup-$([guid]::NewGuid().ToString('N')).dump"

try {
  & docker exec $Container pg_dump --username=$DatabaseUser --dbname=$Database --format=custom --file=$containerPath
  if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
  & docker cp "${Container}:${containerPath}" $resolvedOutput
  if ($LASTEXITCODE -ne 0) { throw "docker cp failed with exit code $LASTEXITCODE" }
  $file = Get-Item -LiteralPath $resolvedOutput
  if ($file.Length -le 0) { throw "Backup file is empty" }
  Write-Output "Backup created: $resolvedOutput ($($file.Length) bytes)"
}
finally {
  & docker exec $Container rm -f $containerPath 2>$null | Out-Null
}

param(
  [string]$Repository = "Komunick/caabnovo"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) is required."
}

foreach ($branch in @("dev", "main")) {
  $body = Get-Content -Raw (Join-Path $PSScriptRoot "rulesets/$branch.json")
  $existing = gh api "repos/$Repository/rulesets" --jq ".[] | select(.name == \"Protect $branch\") | .id"
  if ($existing) {
    $body | gh api --method PUT "repos/$Repository/rulesets/$existing" --input - | Out-Null
  } else {
    $body | gh api --method POST "repos/$Repository/rulesets" --input - | Out-Null
  }
}

Write-Host "Rulesets for dev and main applied to $Repository."

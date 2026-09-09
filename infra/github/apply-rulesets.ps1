[CmdletBinding(SupportsShouldProcess)]
param(
  [ValidatePattern('^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$')]
  [string]$Repository = "Komunick/caabnovo",
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) is required."
}

function Invoke-GitHubApi([string[]]$Arguments) {
  $response = & gh api @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "GitHub API failed (exit $LASTEXITCODE). Stopped; any earlier successful changes remain applied."
  }
  return ($response -join "`n") | ConvertFrom-Json
}

# Exclude inherited rulesets: only repository-owned rulesets may be updated here.
$pages = Invoke-GitHubApi @("repos/$Repository/rulesets?includes_parents=false&per_page=100", "--paginate", "--slurp")
$existingRulesets = @($pages | ForEach-Object { $_ })

# Resolve and parse both configurations before making any change.
$plan = @(foreach ($branch in @("dev", "main")) {
  $path = Join-Path $PSScriptRoot "rulesets/$branch.json"
  $body = Get-Content -LiteralPath $path -Raw -Encoding utf8 | ConvertFrom-Json
  $existing = @($existingRulesets | Where-Object { $_.name -eq $body.name })
  if ($existing.Count -gt 1) {
    throw "Multiple repository rulesets named '$($body.name)'; resolve the ambiguity before applying."
  }
  $method = "POST"
  $endpoint = "repos/$Repository/rulesets"
  if ($existing.Count -eq 1) {
    $method = "PUT"
    $endpoint += "/$($existing[0].id)"
  }
  [PSCustomObject]@{
    Branch = $branch
    Name = $body.name
    Method = $method
    Endpoint = $endpoint
    Path = $path
    RequiredChecks = @(($body.rules | Where-Object type -eq "required_status_checks").parameters.required_status_checks.context)
  }
})

foreach ($item in $plan) {
  $applied = $false
  if ($Apply -and $PSCmdlet.ShouldProcess("$Repository / $($item.Name)", "$($item.Method) ruleset")) {
    Invoke-GitHubApi @("--method", $item.Method, $item.Endpoint, "--input", $item.Path) | Out-Null
    $applied = $true
  }
  [PSCustomObject]@{
    Branch = $item.Branch
    Method = $item.Method
    Endpoint = $item.Endpoint
    RequiredChecks = $item.RequiredChecks -join ", "
    Applied = $applied
  }
}

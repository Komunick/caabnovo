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
    throw "GitHub API failed (exit $LASTEXITCODE). Stopped; inspect the remote dev ruleset before retrying."
  }
  return ($response -join "`n") | ConvertFrom-Json
}

# Exclude inherited rulesets: only repository-owned rulesets may be updated here.
$pages = Invoke-GitHubApi @("repos/$Repository/rulesets?includes_parents=false&per_page=100", "--paginate", "--slurp")
$existingRulesets = @($pages | ForEach-Object { $_ })

# This maintenance entry point is deliberately limited to dev.
$path = Join-Path $PSScriptRoot "rulesets/dev.json"
$body = Get-Content -LiteralPath $path -Raw -Encoding utf8 | ConvertFrom-Json
$existing = @($existingRulesets | Where-Object { $_.name -eq $body.name })
if ($existing.Count -gt 1) {
  throw "Multiple repository rulesets named '$($body.name)'; resolve the ambiguity before applying."
}
$method = "POST"
$endpoint = "repos/$Repository/rulesets"
$targets = @($body)
if ($existing.Count -eq 1) {
  $method = "PUT"
  $endpoint += "/$($existing[0].id)"
  $targets += Invoke-GitHubApi @($endpoint)
}

# Do not overwrite a similarly named rule that also protects another branch.
foreach ($target in $targets) {
  $include = @($target.conditions.ref_name.include)
  if ($target.target -ne "branch" -or $include.Count -ne 1 -or $include[0] -ne "refs/heads/dev" -or @($target.conditions.ref_name.exclude).Count -ne 0) {
    throw "The local and existing rulesets must target only refs/heads/dev without exclusions."
  }
}

$applied = $false
if ($Apply -and $PSCmdlet.ShouldProcess("$Repository / $($body.name)", "$method dev ruleset")) {
  Invoke-GitHubApi @("--method", $method, $endpoint, "--input", $path) | Out-Null
  $applied = $true
}
[PSCustomObject]@{
  Branch = "dev"
  Method = $method
  Endpoint = $endpoint
  RequiredChecks = (($body.rules | Where-Object type -eq "required_status_checks").parameters.required_status_checks.context) -join ", "
  Applied = $applied
}

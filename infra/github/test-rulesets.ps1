$ErrorActionPreference = "Stop"
$applyScript = Join-Path $PSScriptRoot "apply-rulesets.ps1"
$global:RulesetTestState = $null

function Assert-True($Condition, [string]$Message) {
  if (-not $Condition) { throw $Message }
}

# Shadow gh only inside this test process: no request reaches GitHub.
function gh {
  $arguments = @($args)
  $global:RulesetTestState.Calls.Add($arguments) | Out-Null
  $global:LASTEXITCODE = 0
  $method = "GET"
  if ($arguments -contains "--method") {
    $method = $arguments[[Array]::IndexOf($arguments, "--method") + 1]
  }
  if ($method -eq "GET") {
    if ($global:RulesetTestState.FailRead) {
      $global:LASTEXITCODE = 1
      return '{"message":"Forbidden"}'
    }
    if ($arguments -contains "--slurp") { return $global:RulesetTestState.List }
    return $global:RulesetTestState.Existing
  }
  if ($global:RulesetTestState.FailWrite) {
    $global:LASTEXITCODE = 1
    return '{"message":"Validation failed"}'
  }
  $path = $arguments[[Array]::IndexOf($arguments, "--input") + 1]
  Assert-True (Test-Path -LiteralPath $path) "The request must use a versioned JSON file."
  $payload = Get-Content -LiteralPath $path -Raw -Encoding utf8
  $target = $payload | ConvertFrom-Json
  Assert-True ($target.conditions.ref_name.include.Count -eq 1 -and $target.conditions.ref_name.include[0] -eq "refs/heads/dev") "Writes must target dev exclusively."
  return $payload
}

function Reset-TestState {
  $global:RulesetTestState = @{
    Calls = [System.Collections.Generic.List[object]]::new()
    List = '[[]]'
    FailRead = $false
    FailWrite = $false
    Existing = '{"target":"branch","conditions":{"ref_name":{"include":["refs/heads/dev"],"exclude":[]}}}'
  }
}

function Assert-Failure([scriptblock]$Action, [string]$Expected) {
  $message = $null
  try { & $Action | Out-Null } catch { $message = $_.Exception.Message }
  Assert-True ($message -like "*$Expected*") "Expected failure '$Expected'; received '$message'."
}

try {
  Reset-TestState
  $preview = @(& $applyScript)
  Assert-True ($global:RulesetTestState.Calls.Count -eq 1) "Preview must make only one list request."
  Assert-True ($preview.Count -eq 1 -and $preview[0].Branch -eq "dev") "Preview must describe only dev."
  Assert-True ($preview[0].Applied -eq $false) "Preview must not apply a ruleset."
  Write-Host "PASS: default invocation is read-only"

  Reset-TestState
  $created = @(& $applyScript -Apply)
  Assert-True ($global:RulesetTestState.Calls.Count -eq 2) "Apply must list once and create only dev."
  Assert-True ($global:RulesetTestState.Calls[1] -contains "POST") "Missing ruleset must use POST."
  Assert-True ($created.Count -eq 1 -and $created[0].Applied) "Only dev creation must report success."
  Write-Host "PASS: absent rulesets are created"

  Reset-TestState
  $global:RulesetTestState.List = '[[{"id":22,"name":"Protect main"}],[{"id":11,"name":"Protect dev"}]]'
  & $applyScript -Apply | Out-Null
  Assert-True ($global:RulesetTestState.Calls.Count -eq 3) "Update must list, inspect dev and write once."
  Assert-True ($global:RulesetTestState.Calls[2] -contains "PUT") "Existing ruleset must use PUT."
  Assert-True ($global:RulesetTestState.Calls[2] -contains "repos/Komunick/caabnovo/rulesets/11") "Wrong dev ruleset ID."
  Write-Host "PASS: paginated existing rulesets are updated by ID"

  Reset-TestState
  & $applyScript -Apply -WhatIf | Out-Null
  Assert-True ($global:RulesetTestState.Calls.Count -eq 1) "WhatIf must not write."
  Write-Host "PASS: WhatIf does not mutate GitHub"

  Reset-TestState
  $global:RulesetTestState.FailRead = $true
  Assert-Failure { & $applyScript -Apply } "GitHub API failed"
  Assert-True ($global:RulesetTestState.Calls.Count -eq 1) "Failed listing must block writes."
  Write-Host "PASS: failed listing blocks all writes"

  Reset-TestState
  $global:RulesetTestState.FailWrite = $true
  Assert-Failure { & $applyScript -Apply } "GitHub API failed"
  Assert-True ($global:RulesetTestState.Calls.Count -eq 2) "Failed dev write must stop execution."
  Write-Host "PASS: failed write stops subsequent changes"

  Reset-TestState
  $global:RulesetTestState.List = '[[{"id":11,"name":"Protect dev"},{"id":33,"name":"Protect dev"}]]'
  Assert-Failure { & $applyScript -Apply } "Multiple repository rulesets"
  Assert-True ($global:RulesetTestState.Calls.Count -eq 1) "Ambiguous dev must block writes."
  Write-Host "PASS: ambiguous rulesets block the entire application"

  $ci = Get-Content (Join-Path $PSScriptRoot "../../.github/workflows/ci.yml") -Raw
  foreach ($branch in @("dev")) {
    $ruleset = Get-Content (Join-Path $PSScriptRoot "rulesets/$branch.json") -Raw | ConvertFrom-Json
    $checks = @(($ruleset.rules | Where-Object type -eq "required_status_checks").parameters.required_status_checks)
    $expected = @("quality", "browser", "security")
    Assert-True (-not (Compare-Object $expected @($checks.context))) "$branch is missing mandatory CI gates."
    foreach ($check in $checks) {
      Assert-True ($check.integration_id -eq 15368) "Checks must originate from GitHub Actions."
      Assert-True ($ci -match "(?m)^  $([regex]::Escape($check.context)):") "Required check has no workflow job."
    }
    Assert-True ($ruleset.bypass_actors.Count -eq 0) "Rules must not allow bypass."
    Assert-True ($ruleset.enforcement -eq "active") "Rules must be active."
  }
  Write-Host "PASS: required gates match workflows and trusted check provider"

  foreach ($include in @('["refs/heads/main"]', '["refs/heads/dev","refs/heads/main"]', '["~ALL"]')) {
    Reset-TestState
    $global:RulesetTestState.List = '[[{"id":11,"name":"Protect dev"}]]'
    $global:RulesetTestState.Existing = '{"target":"branch","conditions":{"ref_name":{"include":' + $include + ',"exclude":[]}}}'
    Assert-Failure { & $applyScript -Apply } "must target only refs/heads/dev"
    Assert-True ($global:RulesetTestState.Calls.Count -eq 2) "An existing ruleset affecting another branch must never be overwritten."
  }
  Write-Host "PASS: existing main, mixed and wildcard targets are rejected"
} finally {
  Remove-Variable RulesetTestState -Scope Global -ErrorAction SilentlyContinue
}

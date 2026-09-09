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
    return $global:RulesetTestState.List
  }
  if ($global:RulesetTestState.FailWrite) {
    $global:LASTEXITCODE = 1
    return '{"message":"Validation failed"}'
  }
  $path = $arguments[[Array]::IndexOf($arguments, "--input") + 1]
  Assert-True (Test-Path -LiteralPath $path) "The request must use a versioned JSON file."
  return Get-Content -LiteralPath $path -Raw -Encoding utf8
}

function Reset-TestState {
  $global:RulesetTestState = @{
    Calls = [System.Collections.Generic.List[object]]::new()
    List = '[[]]'
    FailRead = $false
    FailWrite = $false
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
  Assert-True ($preview.Count -eq 2) "Preview must describe both branches."
  Assert-True ($preview[0].Applied -eq $false) "Preview must not apply a ruleset."
  Write-Host "PASS: default invocation is read-only"

  Reset-TestState
  $created = @(& $applyScript -Apply)
  Assert-True ($global:RulesetTestState.Calls.Count -eq 3) "Apply must list once and create twice."
  Assert-True ($global:RulesetTestState.Calls[1] -contains "POST") "Missing ruleset must use POST."
  Assert-True ($created[0].Applied -and $created[1].Applied) "Both creations must report success."
  Write-Host "PASS: absent rulesets are created"

  Reset-TestState
  $global:RulesetTestState.List = '[[{"id":11,"name":"Protect dev"}],[{"id":22,"name":"Protect main"}]]'
  & $applyScript -Apply | Out-Null
  Assert-True ($global:RulesetTestState.Calls[1] -contains "PUT") "Existing ruleset must use PUT."
  Assert-True ($global:RulesetTestState.Calls[1] -contains "repos/Komunick/caabnovo/rulesets/11") "Wrong dev ruleset ID."
  Assert-True ($global:RulesetTestState.Calls[2] -contains "repos/Komunick/caabnovo/rulesets/22") "Pagination lost main ruleset."
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
  Assert-True ($global:RulesetTestState.Calls.Count -eq 2) "Failed dev write must stop before main."
  Write-Host "PASS: failed write stops subsequent changes"

  Reset-TestState
  $global:RulesetTestState.List = '[[{"id":11,"name":"Protect dev"},{"id":22,"name":"Protect main"},{"id":33,"name":"Protect main"}]]'
  Assert-Failure { & $applyScript -Apply } "Multiple repository rulesets"
  Assert-True ($global:RulesetTestState.Calls.Count -eq 1) "Ambiguous main must block dev write too."
  Write-Host "PASS: ambiguous rulesets block the entire application"

  $ci = Get-Content (Join-Path $PSScriptRoot "../../.github/workflows/ci.yml") -Raw
  $promotion = Get-Content (Join-Path $PSScriptRoot "../../.github/workflows/promotion.yml") -Raw
  foreach ($branch in @("dev", "main")) {
    $ruleset = Get-Content (Join-Path $PSScriptRoot "rulesets/$branch.json") -Raw | ConvertFrom-Json
    $checks = @(($ruleset.rules | Where-Object type -eq "required_status_checks").parameters.required_status_checks)
    $expected = @("quality", "browser", "security")
    if ($branch -eq "main") { $expected += "validate-source" }
    Assert-True (-not (Compare-Object $expected @($checks.context))) "$branch is missing mandatory CI gates."
    foreach ($check in $checks) {
      Assert-True ($check.integration_id -eq 15368) "Checks must originate from GitHub Actions."
      $workflow = if ($check.context -eq "validate-source") { $promotion } else { $ci }
      Assert-True ($workflow -match "(?m)^  $([regex]::Escape($check.context)):") "Required check has no workflow job."
    }
    Assert-True ($ruleset.bypass_actors.Count -eq 0) "Rules must not allow bypass."
    Assert-True ($ruleset.enforcement -eq "active") "Rules must be active."
  }
  Write-Host "PASS: required gates match workflows and trusted check provider"
} finally {
  Remove-Variable RulesetTestState -Scope Global -ErrorAction SilentlyContinue
}

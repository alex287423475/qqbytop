param(
  [ValidateSet("pipeline", "ab", "local")]
  [string]$Mode = "local",
  [string]$ApiBase = "http://127.0.0.1:8000/api/v1",
  [string]$InputDir = "test_inputs\gaokao_essays",
  [string]$Output = "test_outputs\gaokao_reports",
  [double]$Delay = 2,
  [int]$Limit = 0,
  [string]$PayerContact = "batch-test@example.com",
  [string]$PromptA = "gaokao_default",
  [string]$PromptB = "gaokao_experiment",
  [int]$MinRuleScore = 80,
  [switch]$Judge
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Tool = Join-Path $Backend "tools\batch_report_tester.py"

if (-not (Test-Path $Tool)) {
  throw "Batch tester not found: $Tool"
}

$argsList = @(
  "run", "python", "tools\batch_report_tester.py",
  "--mode", $Mode,
  "--api-base", $ApiBase,
  "--input", (Join-Path $Root $InputDir),
  "--output", (Join-Path $Root $Output),
  "--delay", [string]$Delay,
  "--payer-contact", $PayerContact,
  "--prompt-a", $PromptA,
  "--prompt-b", $PromptB,
  "--min-rule-score", [string]$MinRuleScore
)

if ($Limit -gt 0) {
  $argsList += @("--limit", [string]$Limit)
}

if ($Judge) {
  $argsList += "--judge"
}

Push-Location $Backend
try {
  & uv @argsList
} finally {
  Pop-Location
}

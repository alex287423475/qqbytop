param(
  [int]$BackendPort = 8000,
  [int]$FrontendPort = 3000,
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $Root "backend"
$EnvPath = Join-Path $BackendDir ".env.local-deepseek"
$EnvExamplePath = Join-Path $BackendDir ".env.local-deepseek.example"
$ToolUrl = "http://127.0.0.1:$FrontendPort/tools/gaokao-english-essay-diagnosis"
$BackendApiBase = "http://127.0.0.1:$BackendPort/api/v1"

function Write-Step {
  param([string]$Message)
  Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Test-CommandAvailable {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Test-PortListening {
  param([int]$Port)
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Read-DotEnv {
  param([string]$Path)
  $map = [ordered]@{}
  foreach ($line in Get-Content -Path $Path -Encoding UTF8) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
    $index = $trimmed.IndexOf("=")
    if ($index -lt 1) { continue }
    $key = $trimmed.Substring(0, $index).Trim()
    $value = $trimmed.Substring($index + 1).Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $map[$key] = $value
  }
  return $map
}

function ConvertTo-PowerShellLiteral {
  param([string]$Value)
  return "'" + ($Value -replace "'", "''") + "'"
}

function Wait-HttpOk {
  param(
    [string]$Url,
    [string]$Name,
    [int]$TimeoutSeconds = 60
  )
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $response = Invoke-WebRequest -Uri $Url -TimeoutSec 3 -UseBasicParsing
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
        Write-Host "$Name ready: $Url" -ForegroundColor Green
        return
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  } while ((Get-Date) -lt $deadline)
  throw "$Name did not become ready within $TimeoutSeconds seconds: $Url"
}

Write-Step "Checking project"
if (-not (Test-Path $BackendDir)) { throw "Backend directory not found: $BackendDir" }
if (-not (Test-Path (Join-Path $Root "package.json"))) { throw "package.json not found: $Root" }
if (-not (Test-Path (Join-Path $BackendDir "pyproject.toml"))) { throw "backend/pyproject.toml not found: $BackendDir" }

Write-Step "Checking tools"
foreach ($command in @("uv", "node", "npm")) {
  if (-not (Test-CommandAvailable $command)) {
    throw "Missing command: $command. Please install it before starting local DeepSeek testing."
  }
}

Write-Step "Checking local DeepSeek env"
if (-not (Test-Path $EnvPath)) {
  throw "Missing $EnvPath. Copy $EnvExamplePath to $EnvPath, then fill TENCENT_TOKENHUB_API_KEY."
}
$envMap = Read-DotEnv $EnvPath
$tokenHubKey = [string]$envMap["TENCENT_TOKENHUB_API_KEY"]
if (-not $tokenHubKey -or $tokenHubKey -match "replace|your|<|>") {
  throw "TENCENT_TOKENHUB_API_KEY is empty or still a placeholder in $EnvPath."
}

$defaults = [ordered]@{
  ENVIRONMENT = "development"
  APP_NAME = "gaokao-essay-backend-local-deepseek"
  DRAFT_TOKEN_SECRET = "local-deepseek-change-me"
  REPOSITORY_PROVIDER = "memory"
  DATABASE_URL = ""
  REDIS_URL = ""
  STORAGE_PROVIDER = "mock_presigned"
  OCR_PROVIDER = "mock"
  PAYMENT_PROVIDER = "mock"
  LLM_PROVIDER_ORDER = "tencent_tokenhub"
  TENCENT_TOKENHUB_BASE_URL = "https://tokenhub.tencentmaas.com/v1"
  TENCENT_TOKENHUB_FREE_MODEL = "deepseek-v4-flash"
  TENCENT_TOKENHUB_PAID_MODEL = "deepseek-v4-pro"
  TENCENT_TOKENHUB_FALLBACK_MODEL = "deepseek-v4-flash"
  CORS_ORIGINS = "http://127.0.0.1:$FrontendPort,http://localhost:$FrontendPort"
}
foreach ($key in $defaults.Keys) {
  if (-not $envMap.Contains($key) -or $null -eq $envMap[$key]) {
    $envMap[$key] = $defaults[$key]
  }
}

Write-Step "Starting FastAPI backend"
if (Test-PortListening $BackendPort) {
  Write-Host "Port $BackendPort is already listening. Reusing existing backend process." -ForegroundColor Yellow
  Write-Host "If this process was started with mock LLM, close it and run this script again." -ForegroundColor Yellow
} else {
  $envLines = foreach ($entry in $envMap.GetEnumerator()) {
    "`$env:$($entry.Key) = $(ConvertTo-PowerShellLiteral ([string]$entry.Value))"
  }
  $backendCommand = @"
`$ErrorActionPreference = "Stop"
Set-Location $(ConvertTo-PowerShellLiteral $BackendDir)
$($envLines -join "`r`n")
if (-not (Test-Path ".venv")) { uv sync --group dev }
Write-Host "FastAPI local DeepSeek backend: $BackendApiBase" -ForegroundColor Green
uv run uvicorn app.main:app --host 127.0.0.1 --port $BackendPort --reload
"@
  Start-Process powershell -ArgumentList @("-NoExit", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $backendCommand) | Out-Null
}

Write-Step "Starting Next.js frontend"
if (Test-PortListening $FrontendPort) {
  Write-Host "Port $FrontendPort is already listening. Reusing existing frontend process." -ForegroundColor Yellow
} else {
  $frontendCommand = @"
`$ErrorActionPreference = "Stop"
Set-Location $(ConvertTo-PowerShellLiteral $Root)
`$env:GAOKAO_ESSAY_BACKEND_API_BASE = $(ConvertTo-PowerShellLiteral $BackendApiBase)
if (-not (Test-Path "node_modules")) { npm install }
Write-Host "Next.js local frontend: http://127.0.0.1:$FrontendPort" -ForegroundColor Green
npm run dev -- --hostname 127.0.0.1 --port $FrontendPort
"@
  Start-Process powershell -ArgumentList @("-NoExit", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $frontendCommand) | Out-Null
}

Write-Step "Waiting for services"
Wait-HttpOk "$BackendApiBase/health" "FastAPI backend" 90
Wait-HttpOk $ToolUrl "Next.js frontend" 120

Write-Step "Ready"
Write-Host "Local real DeepSeek test page:" -ForegroundColor Green
Write-Host $ToolUrl
Write-Host ""
Write-Host "Warning: generating a report now calls Tencent TokenHub DeepSeek and may incur API cost." -ForegroundColor Yellow

if (-not $NoOpen) {
  Start-Process $ToolUrl
}


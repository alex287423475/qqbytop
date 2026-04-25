[CmdletBinding()]
param(
  [int]$Port = 3011,
  [string]$Locale = "zh",
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"

function Test-UrlReady {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [int]$TimeoutSec = 5
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
  } catch {
    return $false
  }
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pipelineUrl = "http://127.0.0.1:$Port/$Locale/admin/pipeline"
$nextDir = Join-Path $repoRoot ".next"
$stdoutLog = Join-Path $nextDir "dev-$Port.log"
$stderrLog = Join-Path $nextDir "dev-$Port.err.log"

if (-not (Test-Path (Join-Path $repoRoot "package.json"))) {
  throw "package.json not found. Current directory does not look like the Next.js project root: $repoRoot"
}

if (-not (Test-Path (Join-Path $repoRoot "node_modules"))) {
  Write-Host "node_modules not found. Running npm install first..." -ForegroundColor Yellow
  Push-Location $repoRoot
  try {
    npm install
  } finally {
    Pop-Location
  }
}

if (-not (Test-Path $nextDir)) {
  New-Item -ItemType Directory -Path $nextDir | Out-Null
}

if (Test-UrlReady -Url $pipelineUrl) {
  Write-Host "SEO pipeline is already running: $pipelineUrl" -ForegroundColor Green
  if (-not $NoOpen) {
    Start-Process $pipelineUrl | Out-Null
  }
  exit 0
}

Write-Host "Starting SEO pipeline..." -ForegroundColor Cyan

$command = "Set-Location '$repoRoot'; npm run dev -- --hostname 127.0.0.1 --port $Port"
$process = Start-Process `
  -FilePath "powershell.exe" `
  -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $command `
  -WorkingDirectory $repoRoot `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -WindowStyle Minimized `
  -PassThru

$ready = $false
$deadline = (Get-Date).AddSeconds(45)
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 2

  if ($process.HasExited) {
    break
  }

  if (Test-UrlReady -Url $pipelineUrl) {
    $ready = $true
    break
  }
}

if (-not $ready) {
  $stdoutTail = if (Test-Path $stdoutLog) { (Get-Content $stdoutLog -Tail 20 -ErrorAction SilentlyContinue) -join "`n" } else { "" }
  $stderrTail = if (Test-Path $stderrLog) { (Get-Content $stderrLog -Tail 20 -ErrorAction SilentlyContinue) -join "`n" } else { "" }
  throw "Startup failed. Check logs.`nSTDOUT:`n$stdoutTail`n`nSTDERR:`n$stderrTail"
}

Write-Host "SEO pipeline is ready: $pipelineUrl" -ForegroundColor Green
Write-Host "Logs:" -ForegroundColor DarkGray
Write-Host "  $stdoutLog" -ForegroundColor DarkGray
Write-Host "  $stderrLog" -ForegroundColor DarkGray

if (-not $NoOpen) {
  Start-Process $pipelineUrl | Out-Null
}

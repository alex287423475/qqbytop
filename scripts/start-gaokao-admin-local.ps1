param(
  [int]$BackendPort = 8000,
  [int]$FrontendPort = 3000
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
$Launcher = Join-Path $ScriptDir "start-gaokao-local-real-deepseek.ps1"
$AdminUrl = "http://127.0.0.1:$FrontendPort/admin/login?next=/admin/gaokao-essay"

if (-not (Test-Path $Launcher)) {
  throw "Launcher not found: $Launcher"
}

& $Launcher -BackendPort $BackendPort -FrontendPort $FrontendPort -NoOpen

Write-Host ""
Write-Host "Gaokao admin console:" -ForegroundColor Green
Write-Host $AdminUrl
Start-Process $AdminUrl

param(
  [int]$BackendPort = 8000,
  [int]$FrontendPort = 3000
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Launcher = Join-Path $Root "scripts\start-gaokao-admin-local.ps1"

if (-not (Test-Path $Launcher)) {
  throw "Launcher not found: $Launcher"
}

& $Launcher -BackendPort $BackendPort -FrontendPort $FrontendPort -NoOpen

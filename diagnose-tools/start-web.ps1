$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (Test-Path ".env.local") {
  Get-Content ".env.local" | ForEach-Object {
    if ($_ -match "^\s*#" -or $_ -notmatch "=") { return }
    $name, $value = $_ -split "=", 2
    [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), "Process")
  }
}

if (-not $env:PORT) {
  $env:PORT = "4188"
}

node server.mjs

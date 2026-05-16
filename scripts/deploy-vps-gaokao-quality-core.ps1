param(
  [string]$HostName = "101.42.94.23",
  [string]$User = "ubuntu",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\qqbytop_vps_codex",
  [string]$RemoteDir = "/var/www/qqbytop-next",
  [switch]$SkipTests
)

$ErrorActionPreference = "Stop"

$files = @(
  "backend/prompts/gaokao_default.md",
  "backend/prompts/gaokao_error_taxonomy.md",
  "backend/prompts/gaokao_scoring_rubric.md",
  "backend/prompts/gaokao_writing_checklist.md",
  "backend/app/services/report_quality.py",
  "backend/app/adapters/llm.py",
  "backend/app/models/schemas.py",
  "backend/app/services/core.py"
)

foreach ($file in $files) {
  if (-not (Test-Path $file -PathType Leaf)) {
    throw "Missing required file: $file"
  }
}

if (-not (Test-Path $KeyPath -PathType Leaf)) {
  throw "Missing SSH key: $KeyPath"
}

if (-not $SkipTests) {
  Push-Location backend
  try {
    uv run pytest tests/test_gaokao_flow.py tests/test_gaokao_task_extraction.py
  }
  finally {
    Pop-Location
  }
}

$archive = Join-Path $env:TEMP "qqbytop-gaokao-quality-core.tar.gz"
if (Test-Path $archive) {
  Remove-Item $archive -Force
}

tar -czf $archive @files

scp -i $KeyPath $archive "${User}@${HostName}:/tmp/qqbytop-gaokao-quality-core.tar.gz"

ssh -i $KeyPath "${User}@${HostName}" @"
set -e
cd "$RemoteDir"
mkdir -p /tmp/qqbytop-quality-core-backup
for file in $($files -join ' '); do
  if [ -f "`$file" ]; then
    mkdir -p "/tmp/qqbytop-quality-core-backup/`$(dirname "`$file")"
    cp "`$file" "/tmp/qqbytop-quality-core-backup/`$file"
  fi
done
tar -xzf /tmp/qqbytop-gaokao-quality-core.tar.gz -C "$RemoteDir"
rm /tmp/qqbytop-gaokao-quality-core.tar.gz
pm2 restart gaokao-essay-api --update-env
sleep 2
pm2 status gaokao-essay-api
curl -s --max-time 10 http://127.0.0.1:8000/api/v1/health || true
"@

Remove-Item $archive -Force
Write-Host "Gaokao quality core files deployed to $HostName and gaokao-essay-api restarted."

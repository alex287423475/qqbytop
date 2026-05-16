param(
  [string]$HostName = "101.42.94.23",
  [string]$User = "ubuntu",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\qqbytop_vps_codex",
  [string]$RemoteDir = "/var/www/qqbytop-next",
  [switch]$SkipRemoteNginx
)

$ErrorActionPreference = "Stop"

$archive = Join-Path $env:TEMP "qqbytop-next-gaokao-deploy.tar.gz"
if (Test-Path $archive) {
  Remove-Item $archive -Force
}

npm run typecheck
npm run build
Push-Location backend
try {
  uv run ruff check app tests
  uv run pytest
}
finally {
  Pop-Location
}

tar -czf $archive `
  --exclude .git `
  --exclude node_modules `
  --exclude .next `
  --exclude .vercel `
  --exclude "backend/.venv" `
  --exclude "*.log" `
  --exclude ".env.local" `
  --exclude ".env" `
  --exclude ".env.production" `
  --exclude "backend/.env" `
  --exclude "backend/.env.local-deepseek" `
  .

ssh -i $KeyPath "${User}@${HostName}" "sudo mkdir -p $RemoteDir && sudo chown -R ${User}:${User} $RemoteDir"
scp -i $KeyPath $archive "${User}@${HostName}:/tmp/qqbytop-next-gaokao-deploy.tar.gz"

$nginxStep = if ($SkipRemoteNginx) {
  "echo 'Skipping Nginx config install.'"
} else {
  "sudo cp $RemoteDir/deploy/gaokao-essay/nginx-qqbytop.conf /etc/nginx/sites-available/qqbytop.com && sudo ln -sf /etc/nginx/sites-available/qqbytop.com /etc/nginx/sites-enabled/qqbytop.com && sudo nginx -t && sudo systemctl reload nginx"
}

ssh -i $KeyPath "${User}@${HostName}" @"
set -e
tmp_env_dir="/tmp/qqbytop-env-backup-`$(date +%s)"
mkdir -p "`$tmp_env_dir/backend"
if [ -f "$RemoteDir/.env.production" ]; then
  cp "$RemoteDir/.env.production" "`$tmp_env_dir/.env.production"
fi
if [ -f "$RemoteDir/backend/.env" ]; then
  cp "$RemoteDir/backend/.env" "`$tmp_env_dir/backend/.env"
fi
rm -rf $RemoteDir/* $RemoteDir/.[!.]* $RemoteDir/..?* 2>/dev/null || true
tar -xzf /tmp/qqbytop-next-gaokao-deploy.tar.gz -C $RemoteDir
rm /tmp/qqbytop-next-gaokao-deploy.tar.gz
if [ -f "`$tmp_env_dir/.env.production" ]; then
  cp "`$tmp_env_dir/.env.production" "$RemoteDir/.env.production"
fi
if [ -f "`$tmp_env_dir/backend/.env" ]; then
  mkdir -p "$RemoteDir/backend"
  cp "`$tmp_env_dir/backend/.env" "$RemoteDir/backend/.env"
fi
rm -rf "`$tmp_env_dir"
cd $RemoteDir
if [ ! -f "$RemoteDir/.env.production" ]; then
  echo "Missing $RemoteDir/.env.production. Create it from .env.production.example with production values before building Next.js." >&2
  exit 1
fi
npm ci
npm run build
npm prune --omit=dev
cd $RemoteDir/backend
command -v uv >/dev/null 2>&1 || curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="`$HOME/.local/bin:`$PATH"
uv sync --no-dev
cd $RemoteDir
if [ ! -f "$RemoteDir/backend/.env" ]; then
  echo "Missing $RemoteDir/backend/.env. Create it from .env.example with production values before starting gaokao-essay-api." >&2
fi
pm2 delete qqbytop-next >/dev/null 2>&1 || true
pm2 delete gaokao-essay-api >/dev/null 2>&1 || true
pm2 start deploy/gaokao-essay/ecosystem.config.cjs --only qqbytop-next
if [ -f "$RemoteDir/backend/.env" ]; then
  pm2 start deploy/gaokao-essay/ecosystem.config.cjs --only gaokao-essay-api
fi
pm2 save
$nginxStep
curl -I --max-time 10 http://127.0.0.1:3000/tools/gaokao-english-essay-diagnosis
curl -s --max-time 10 http://127.0.0.1:8000/api/v1/health || true
"@

Write-Host "Gaokao essay deployment package installed on $HostName."

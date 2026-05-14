param(
  [string]$HostName = "101.42.94.23",
  [string]$User = "ubuntu",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\qqbytop_vps_ed25519",
  [string]$RemoteDir = "/var/www/qqbytop-next"
)

$ErrorActionPreference = "Stop"

$archive = Join-Path $env:TEMP "qqbytop-next-deploy.tar.gz"
if (Test-Path $archive) {
  Remove-Item $archive -Force
}

npm run typecheck
npm run build

tar -czf $archive `
  --exclude .git `
  --exclude node_modules `
  --exclude .next `
  --exclude .vercel `
  --exclude "*.log" `
  --exclude ".env.local" `
  --exclude ".env" `
  .

ssh -i $KeyPath "${User}@${HostName}" "sudo mkdir -p $RemoteDir && sudo chown -R ${User}:${User} $RemoteDir"
scp -i $KeyPath $archive "${User}@${HostName}:/tmp/qqbytop-next-deploy.tar.gz"

ssh -i $KeyPath "${User}@${HostName}" @"
set -e
pm2 stop qqbytop-next >/dev/null 2>&1 || true
rm -rf $RemoteDir/* $RemoteDir/.[!.]* $RemoteDir/..?* 2>/dev/null || true
tar -xzf /tmp/qqbytop-next-deploy.tar.gz -C $RemoteDir
rm /tmp/qqbytop-next-deploy.tar.gz
cd $RemoteDir
npm ci
npm run build
npm prune --omit=dev
pm2 delete qqbytop-next >/dev/null 2>&1 || true
pm2 start node_modules/next/dist/bin/next --name qqbytop-next -- start -H 127.0.0.1 -p 3000
pm2 save
sleep 3
curl -I --max-time 10 http://127.0.0.1:3000/
"@

Write-Host "Deployed to http://$HostName/"

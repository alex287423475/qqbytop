param(
  [string]$Message = "",
  [switch]$TagStable,
  [string]$TagName = ""
)

$ErrorActionPreference = "Stop"

function Assert-GitRepo {
  git rev-parse --is-inside-work-tree *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Current directory is not a Git repository."
  }
}

Assert-GitRepo

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
if ([string]::IsNullOrWhiteSpace($Message)) {
  $Message = "checkpoint: $timestamp"
}

Write-Host "== Git status before checkpoint =="
git status --short

Write-Host "== Staging non-ignored changes =="
git add -A -- .

$staged = git diff --cached --name-only
if ([string]::IsNullOrWhiteSpace(($staged -join ""))) {
  Write-Host "No staged changes. Nothing to commit."
  exit 0
}

Write-Host "== Staged files =="
$staged | ForEach-Object { Write-Host $_ }

Write-Host "== Creating checkpoint commit =="
git commit -m $Message

if ($TagStable) {
  if ([string]::IsNullOrWhiteSpace($TagName)) {
    $TagName = "stable-$timestamp"
  }
  Write-Host "== Creating stable tag: $TagName =="
  git tag $TagName
}

Write-Host "== Recent checkpoints =="
git log --oneline -5

Write-Host "Checkpoint saved."

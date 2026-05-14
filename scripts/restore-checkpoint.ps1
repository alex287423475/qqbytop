param(
  [string]$Ref = "",
  [switch]$List,
  [switch]$ConfirmRestore,
  [switch]$RemoveUntracked
)

$ErrorActionPreference = "Stop"

function Assert-GitRepo {
  git rev-parse --is-inside-work-tree *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Current directory is not a Git repository."
  }
}

Assert-GitRepo

if ($List -or [string]::IsNullOrWhiteSpace($Ref)) {
  Write-Host "== Recent commits =="
  git log --oneline -15
  Write-Host ""
  Write-Host "== Stable tags =="
  git tag --list "stable-*" --sort=-creatordate
  Write-Host ""
  Write-Host "To restore, run:"
  Write-Host "powershell -ExecutionPolicy Bypass -File scripts\restore-checkpoint.ps1 -Ref <commit-or-tag> -ConfirmRestore"
  exit 0
}

git rev-parse --verify "$Ref^{commit}" *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Ref not found or not a commit: $Ref"
}

Write-Host "== Current status =="
git status --short

Write-Host "== Files that would differ from $Ref =="
git diff --name-status $Ref -- .

if (-not $ConfirmRestore) {
  Write-Host ""
  Write-Host "Preview only. Add -ConfirmRestore to restore tracked files from $Ref."
  Write-Host "Optional: add -RemoveUntracked to delete untracked files after restore."
  exit 0
}

Write-Host "== Restoring tracked files from $Ref =="
git restore --source $Ref -- .

if ($RemoveUntracked) {
  Write-Host "== Removing untracked files =="
  git clean -fd
}

Write-Host "== Status after restore =="
git status --short

Write-Host "Restore completed."

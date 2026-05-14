$ErrorActionPreference = "Stop"

function Assert-GitRepo {
  git rev-parse --is-inside-work-tree *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Current directory is not a Git repository."
  }
}

Assert-GitRepo

$items = New-Object System.Collections.Generic.List[object]

$tags = git tag --list "stable-*" --sort=-creatordate
foreach ($tag in $tags) {
  $subject = git log -1 --format=%s $tag
  $items.Add([pscustomobject]@{
    Type = "tag"
    Ref = $tag
    Label = "$tag  |  $subject"
  })
}

$commits = git log --oneline -20
foreach ($line in $commits) {
  if ($line -match "^([0-9a-f]+)\s+(.+)$") {
    $items.Add([pscustomobject]@{
      Type = "commit"
      Ref = $matches[1]
      Label = $line
    })
  }
}

if ($items.Count -eq 0) {
  Write-Host "No checkpoint found."
  exit 0
}

Write-Host "== Available restore points =="
for ($i = 0; $i -lt $items.Count; $i++) {
  $n = $i + 1
  Write-Host ("[{0}] {1}: {2}" -f $n, $items[$i].Type, $items[$i].Label)
}

Write-Host ""
$choice = Read-Host "Enter number to preview/restore, or press Enter to cancel"
if ([string]::IsNullOrWhiteSpace($choice)) {
  Write-Host "Cancelled."
  exit 0
}

$index = 0
if (-not [int]::TryParse($choice, [ref]$index) -or $index -lt 1 -or $index -gt $items.Count) {
  throw "Invalid selection: $choice"
}

$selected = $items[$index - 1]
Write-Host ""
Write-Host "Selected: $($selected.Ref)"
Write-Host ""

Write-Host "== Files that would differ =="
git diff --name-status $selected.Ref -- .

Write-Host ""
$confirm = Read-Host "Type YES to restore tracked files to $($selected.Ref)"
if ($confirm -ne "YES") {
  Write-Host "Restore cancelled."
  exit 0
}

git restore --source $selected.Ref -- .

Write-Host ""
Write-Host "== Status after restore =="
git status --short
Write-Host ""
Write-Host "Restore completed."

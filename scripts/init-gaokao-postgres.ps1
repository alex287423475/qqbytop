param(
  [string]$BackendEnvPath = "backend/.env",
  [string]$MigrationPath = "backend/migrations/001_gaokao_essay.sql"
)

$ErrorActionPreference = "Stop"

function Read-EnvFile([string]$Path) {
  $map = @{}
  if (!(Test-Path $Path)) {
    throw "Missing env file: $Path"
  }
  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (!$line -or $line.StartsWith("#") -or !$line.Contains("=")) { return }
    $key, $value = $line.Split("=", 2)
    $map[$key.Trim()] = $value.Trim()
  }
  return $map
}

if (!(Test-Path $MigrationPath)) {
  throw "Missing migration file: $MigrationPath"
}

$envMap = Read-EnvFile $BackendEnvPath
$databaseUrl = $envMap["DATABASE_URL"]
if (!$databaseUrl) {
  throw "DATABASE_URL is required in $BackendEnvPath"
}

$env:DATABASE_URL = $databaseUrl
@'
import os
import pathlib
import psycopg

database_url = os.environ["DATABASE_URL"]
migration_path = pathlib.Path(os.environ["MIGRATION_PATH"])
sql = migration_path.read_text(encoding="utf-8")
with psycopg.connect(database_url) as conn:
    with conn.cursor() as cursor:
        cursor.execute(sql)
    conn.commit()
print(f"Applied migration: {migration_path}")
'@ | Set-Content -LiteralPath "$env:TEMP\init_gaokao_postgres.py" -Encoding UTF8
$env:MIGRATION_PATH = (Resolve-Path $MigrationPath).Path
Push-Location backend
try {
  uv run python "$env:TEMP\init_gaokao_postgres.py"
}
finally {
  Pop-Location
}

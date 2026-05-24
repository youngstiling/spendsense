# Applies supabase/fix-spend-transactions-schema.sql to your remote database.
# Usage (from repo root):
#   .\scripts\run-supabase-schema-fix.ps1
# Or with password in env (do not commit):
#   $env:SUPABASE_DB_PASSWORD = "your-db-password"
#   .\scripts\run-supabase-schema-fix.ps1

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

$projectRef = "iptblxxntgabuqdnrzvk"
$sqlFile = Join-Path $root "supabase\fix-spend-transactions-schema.sql"

if (-not (Test-Path $sqlFile)) {
  Write-Host "Missing $sqlFile" -ForegroundColor Red
  exit 1
}

$password = $env:SUPABASE_DB_PASSWORD
if (-not $password) {
  $secure = Read-Host "Supabase database password (Project Settings -> Database)" -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

$encoded = [uri]::EscapeDataString($password)
$dbUrl = "postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres"

$nodeDir = "$env:LOCALAPPDATA\nodejs\node-v24.15.0-win-x64"
if (-not (Test-Path "$nodeDir\npx.cmd")) {
  Write-Host "Node/npx not found. Install Node or run SQL manually in Supabase SQL Editor." -ForegroundColor Red
  exit 1
}
$npx = Join-Path $nodeDir "npx.cmd"

Write-Host "Running schema fix on $projectRef ..." -ForegroundColor Cyan
& $npx supabase db query --db-url $dbUrl -f $sqlFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Verifying supplier columns ..." -ForegroundColor Cyan
$verify = "select column_name from information_schema.columns where table_name = 'spend_transactions' and column_name ilike '%supplier%' order by column_name;"
& $npx supabase db query --db-url $dbUrl $verify
Write-Host "Done." -ForegroundColor Green

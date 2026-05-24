# Deploy SpendSense to Vercel (Option B - remote colleague sharing)
# Run from PowerShell: .\deploy-vercel.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$nodeDir = "$env:LOCALAPPDATA\nodejs\node-v24.15.0-win-x64"
if (-not (Test-Path "$nodeDir\npm.cmd")) {
  $nodeDir = (Get-ChildItem "$env:LOCALAPPDATA\nodejs" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
}
if (-not $nodeDir -or -not (Test-Path "$nodeDir\npm.cmd")) {
  Write-Host "Node not found. Run install-node.ps1 first." -ForegroundColor Red
  exit 1
}
$npm = Join-Path $nodeDir "npm.cmd"
$npx = Join-Path $nodeDir "npx.cmd"

Write-Host ""
Write-Host "=== SpendSense Vercel deploy ===" -ForegroundColor Cyan
Write-Host ""

# Load Supabase values from .env.local if present (for display only)
$supabaseUrl = ""
$supabaseKey = ""
if (Test-Path ".env.local") {
  Get-Content ".env.local" | ForEach-Object {
    if ($_ -match '^NEXT_PUBLIC_SUPABASE_URL=(.+)$') { $supabaseUrl = $matches[1].Trim() }
    if ($_ -match '^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$') { $supabaseKey = $matches[1].Trim() }
  }
}

Write-Host "Step 1: Production build check..." -ForegroundColor Yellow
& $npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed. Fix errors and retry." -ForegroundColor Red
  exit 1
}
Write-Host "Build OK." -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Before deploy, set these in Vercel (Project -> Settings -> Environment Variables):" -ForegroundColor Yellow
Write-Host "  NEXT_PUBLIC_DEMO_MODE = false"
Write-Host "  DEMO_MODE = false"
if ($supabaseUrl) {
  Write-Host "  NEXT_PUBLIC_SUPABASE_URL = $supabaseUrl"
} else {
  Write-Host "  NEXT_PUBLIC_SUPABASE_URL = (from Supabase dashboard -> Settings -> API)"
}
if ($supabaseKey) {
  Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY = (your anon key from .env.local)"
} else {
  Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY = (from Supabase dashboard -> Settings -> API)"
}
Write-Host ""
Write-Host "Apply to: Production (and Preview if you want preview deploys to work)."
Write-Host ""

Write-Host "Step 3: Supabase SQL (if not done yet):" -ForegroundColor Yellow
Write-Host "  Open supabase/full-setup.sql in Supabase SQL Editor and Run."
Write-Host ""

Write-Host "Step 4: Vercel CLI deploy..." -ForegroundColor Yellow
Write-Host "  A browser window will open to log in to Vercel (free account is fine)."
Write-Host "  When prompted: link to existing project or create 'spendsense'."
Write-Host ""

$confirm = Read-Host "Ready to deploy? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
  Write-Host "Cancelled. See VERCEL-DEPLOY.md for manual steps."
  exit 0
}

& $npx vercel --prod
if ($LASTEXITCODE -ne 0) {
  Write-Host "Deploy failed. See VERCEL-DEPLOY.md for troubleshooting." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "=== After deploy ===" -ForegroundColor Cyan
Write-Host "1. Copy your Vercel URL (e.g. https://spendsense-xxx.vercel.app)"
Write-Host "2. Supabase -> Authentication -> URL Configuration:"
Write-Host "     Site URL: https://YOUR-APP.vercel.app"
Write-Host "     Redirect URLs: https://YOUR-APP.vercel.app/auth/callback"
Write-Host "3. Redeploy once if env vars were added after first deploy."
Write-Host "4. Share the URL with your colleague. They log in at /login with email magic link."
Write-Host ""
Write-Host "Sample CSV on the live site: /pub_demo_portfolio.csv"
Write-Host "Full checklist: VERCEL-DEPLOY.md"
Write-Host ""

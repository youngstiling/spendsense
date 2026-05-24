# SpendSense — one script to finish magic-link setup
# Right-click -> Run with PowerShell   OR:  .\finish-setup.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "=== SpendSense: finish magic-link setup ===" -ForegroundColor Cyan
Write-Host ""

# --- Node ---
$nodeDir = "$env:LOCALAPPDATA\nodejs\node-v24.15.0-win-x64"
if (-not (Test-Path "$nodeDir\npm.cmd")) {
  $nodeDir = (Get-ChildItem "$env:LOCALAPPDATA\nodejs" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
}
if (-not $nodeDir -or -not (Test-Path "$nodeDir\npm.cmd")) {
  Write-Host "Node not found. Run: .\install-node.ps1" -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}
$npm = Join-Path $nodeDir "npm.cmd"
$npx = Join-Path $nodeDir "npx.cmd"

# --- Git (optional — for GitHub push) ---
$git = $null
foreach ($p in @(
  "$env:LOCALAPPDATA\Programs\Git\bin\git.exe",
  "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
  "C:\Program Files\Git\cmd\git.exe",
  "C:\Program Files (x86)\Git\cmd\git.exe"
)) {
  if (Test-Path $p) { $git = $p; break }
}
if (-not $git) {
  $found = Get-ChildItem "C:\Program Files\Git" -Recurse -Filter "git.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($found) { $git = $found.FullName }
}

$prodUrl = "https://spendsense-wine-five.vercel.app"
$callback = "$prodUrl/auth/callback"

Write-Host "Step 1/4: Build..." -ForegroundColor Yellow
& $npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed. Fix errors above, then run this script again." -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}
Write-Host "Build OK." -ForegroundColor Green
Write-Host ""

if ($git) {
  Write-Host "Step 2/4: Push to GitHub (triggers Vercel if connected)..." -ForegroundColor Yellow
  & $git add src/app/auth src/app/login src/lib/supabase/auth-redirect.ts .env.local.example SUPABASE-SETUP.md VERCEL-DEPLOY.md finish-setup.ps1 2>$null
  $status = & $git status --porcelain 2>$null
  if ($status) {
    & $git commit -m "Fix magic link auth on Vercel (callback cookies + redirect host)"
    & $git push origin main
    if ($LASTEXITCODE -eq 0) {
      Write-Host "Pushed to GitHub." -ForegroundColor Green
    } else {
      Write-Host "Push failed — you may need to sign in to GitHub in a browser." -ForegroundColor Yellow
    }
  } else {
    Write-Host "Nothing new to commit (already pushed?)." -ForegroundColor Gray
  }
} else {
  Write-Host "Step 2/4: Git not found — skipping push. Will use Vercel CLI instead." -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Step 3/4: Deploy to Vercel..." -ForegroundColor Yellow
Write-Host "  (Browser may open to log in — use your Vercel account)" -ForegroundColor Gray
& $npx vercel deploy --prod --yes
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Vercel deploy failed. Try: open https://vercel.com/dashboard" -ForegroundColor Yellow
  Write-Host "  -> your spendsense project -> Deployments -> Redeploy" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Step 4/4: Supabase (YOU must click Save — 30 seconds)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. This page will open in your browser." -ForegroundColor White
Write-Host "  2. Set Site URL to:" -ForegroundColor White
Write-Host "     $prodUrl" -ForegroundColor Cyan
Write-Host "  3. Under Redirect URLs, ADD this line (keep localhost if listed):" -ForegroundColor White
Write-Host "     $callback" -ForegroundColor Cyan
Write-Host "  4. Click SAVE at the bottom." -ForegroundColor White
Write-Host ""

$supabaseAuthUrl = "https://supabase.com/dashboard/project/iptblxxntgabuqdnrzvk/auth/url-configuration"
Start-Process $supabaseAuthUrl

Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "Test: $prodUrl/login" -ForegroundColor Cyan
Write-Host "  -> enter email -> open magic link from email -> should reach Dashboard" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to close"

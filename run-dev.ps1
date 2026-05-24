# Run SpendSense without needing npm on PATH
$nodeDir = "$env:LOCALAPPDATA\nodejs\node-v24.15.0-win-x64"
if (-not (Test-Path "$nodeDir\npm.cmd")) {
  $nodeDir = (Get-ChildItem "$env:LOCALAPPDATA\nodejs" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
}
if (-not $nodeDir -or -not (Test-Path "$nodeDir\npm.cmd")) {
  Write-Host "Node not found. Run install-node.ps1 first."
  exit 1
}
$npm = Join-Path $nodeDir "npm.cmd"
Set-Location $PSScriptRoot
if (-not (Test-Path "node_modules")) {
  & $npm install
}
# Free port 3000 if a stale dev server is stuck
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

# Fix "Internal Server Error" from a corrupted or production .next cache
if (Test-Path ".next") {
  $clearCache = -not (Test-Path ".next\routes-manifest.json")
  # `npm run build` leaves export-marker.json; dev needs a fresh cache
  if (-not $clearCache -and (Test-Path ".next\export-marker.json")) {
    $clearCache = $true
  }
  if ($clearCache) {
    Write-Host "Clearing stale build cache..."
    Remove-Item -Recurse -Force .next
  }
}

& $npm run dev

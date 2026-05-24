# Portable Node.js — no admin required
$ver = "v24.15.0"
$dest = "$env:LOCALAPPDATA\nodejs"
$zip = "$env:TEMP\node-$ver-win-x64.zip"
$url = "https://nodejs.org/dist/$ver/node-$ver-win-x64.zip"

Write-Host "Downloading Node.js $ver..."
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing

Write-Host "Extracting to $dest..."
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Expand-Archive -Path $zip -DestinationPath $dest -Force
Remove-Item $zip -Force

$nodeDir = Join-Path $dest "node-$ver-win-x64"
if (-not (Test-Path $nodeDir)) {
  $nodeDir = (Get-ChildItem $dest -Directory | Select-Object -First 1).FullName
}
Write-Host "Done. Node is at: $nodeDir"
& "$nodeDir\node.exe" -v
& "$nodeDir\npm.cmd" -v
Write-Host ""
Write-Host "Next: .\run-dev.ps1"

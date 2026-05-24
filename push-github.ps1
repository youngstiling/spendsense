# One-time push to GitHub (repo must exist: github.com/youngstiling/spendsense)
# Usage: .\push-github.ps1
# Or:    .\push-github.ps1 -Token "ghp_your_token_here"

param([string]$Token)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
  [System.Environment]::GetEnvironmentVariable("Path", "User")

$remote = "https://github.com/youngstiling/spendsense.git"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "Git not found. Install Git for Windows first."
  exit 1
}

git remote remove origin 2>$null
git remote add origin $remote

Write-Host "Branch: $(git branch --show-current)"
Write-Host "Commits to push:"
git log --oneline -3

if (-not $Token) {
  Write-Host ""
  Write-Host "Create a token (classic) with 'repo' scope:"
  Write-Host "  https://github.com/settings/tokens/new?scopes=repo"
  Write-Host ""
  $Token = Read-Host "Paste GitHub token"
}

if (-not $Token.Trim()) {
  Write-Host "No token provided."
  exit 1
}

$pushUrl = "https://x-access-token:$($Token.Trim())@github.com/youngstiling/spendsense.git"

Write-Host "Pushing to GitHub..."
git push $pushUrl HEAD:main

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "Done: https://github.com/youngstiling/spendsense"
  git branch --set-upstream-to=origin/main main 2>$null
  git remote set-url origin $remote
} else {
  Write-Host "Push failed. Check token has 'repo' scope and repo exists."
  exit $LASTEXITCODE
}

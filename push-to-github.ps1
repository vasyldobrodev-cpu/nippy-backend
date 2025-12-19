# GitHub Push Script
# This script helps you push to GitHub using a Personal Access Token

Write-Host "=== GitHub Push Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check current remote
Write-Host "Current remote URL:" -ForegroundColor Yellow
git remote -v
Write-Host ""

# Option 1: Use Personal Access Token
Write-Host "Option 1: Use Personal Access Token (HTTPS)" -ForegroundColor Green
Write-Host "1. Go to: https://github.com/settings/tokens" -ForegroundColor White
Write-Host "2. Click 'Generate new token (classic)'" -ForegroundColor White
Write-Host "3. Select 'repo' scope" -ForegroundColor White
Write-Host "4. Copy the token" -ForegroundColor White
Write-Host ""
$token = Read-Host "Enter your Personal Access Token"

if ($token) {
    git remote set-url origin "https://$token@github.com/vasyldobrodev-cpu/nippy-backend.git"
    Write-Host "Remote URL updated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now you can push with: git push origin main" -ForegroundColor Cyan
}

# Option 2: Use SSH
Write-Host ""
Write-Host "Option 2: Use SSH (More secure, recommended for long-term)" -ForegroundColor Green
Write-Host "Run these commands:" -ForegroundColor White
Write-Host "  ssh-keygen -t ed25519 -C `"vasyl.dobro.dev@gmail.com`"" -ForegroundColor Yellow
Write-Host "  # Copy the public key:" -ForegroundColor Yellow
Write-Host "  Get-Content `$env:USERPROFILE\.ssh\id_ed25519.pub" -ForegroundColor Yellow
Write-Host "  # Add it to GitHub: https://github.com/settings/keys" -ForegroundColor Yellow
Write-Host "  git remote set-url origin git@github.com:vasyldobrodev-cpu/nippy-backend.git" -ForegroundColor Yellow


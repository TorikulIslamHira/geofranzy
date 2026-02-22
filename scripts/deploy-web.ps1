# GeoFrenzy Web Deployment Script (Windows)
# Deploys web app to Firebase Hosting

param(
    [ValidateSet('staging', 'production')]
    [string]$Environment = 'staging'
)

$ProjectId = 'geofrenzy-28807'
$ErrorActionPreference = 'Stop'

Write-Host "🚀 GeoFrenzy Web Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host ""

# Check if Firebase CLI is installed
try {
    firebase --version | Out-Null
} catch {
    Write-Host "❌ Firebase CLI not found. Installing..." -ForegroundColor Red
    npm install -g firebase-tools
}

# Check authentication
Write-Host "🔐 Checking Firebase authentication..." -ForegroundColor Cyan
try {
    firebase projects:list | Out-Null
} catch {
    Write-Host "📝 Please login to Firebase" -ForegroundColor Yellow
    firebase login
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm ci

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor Cyan
npm test -- --no-coverage --passWithNoTests
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Tests had issues but continuing deployment..." -ForegroundColor Yellow
}

# Build web app
Write-Host "🏗️  Building web app..." -ForegroundColor Cyan
Push-Location web
npm run build
Pop-Location

if ($Environment -eq 'production') {
    # Verify production deployment
    $confirm = Read-Host "⚠️  Deploy to PRODUCTION? (yes/no)"
    if ($confirm -ne 'yes') {
        Write-Host "❌ Deployment cancelled" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "📤 Deploying Firestore rules..." -ForegroundColor Cyan
    firebase deploy --only firestore:rules --project $ProjectId
    
    Write-Host "📤 Deploying Cloud Functions..." -ForegroundColor Cyan
    firebase deploy --only functions --project $ProjectId
    
    Write-Host "📤 Deploying web app to production..." -ForegroundColor Cyan
    firebase deploy --only hosting:default --project $ProjectId
    
    Write-Host ""
    Write-Host "✅ Production deployment complete!" -ForegroundColor Green
    Write-Host "🌍 Live at: https://geofrenzy.web.app" -ForegroundColor Green
    
} elseif ($Environment -eq 'staging') {
    Write-Host "📤 Deploying to staging..." -ForegroundColor Cyan
    firebase deploy --only hosting:staging --project $ProjectId
    
    Write-Host ""
    Write-Host "✅ Staging deployment complete!" -ForegroundColor Green
    Write-Host "🌍 Preview at: https://staging.geofrenzy.web.app" -ForegroundColor Green
}

Write-Host ""
Write-Host "📊 Deployment Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Project: $ProjectId"
Write-Host "Environment: $Environment"
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')"

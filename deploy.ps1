# Geofranzy Firebase Deployment Script
# This script deploys Firebase resources and web hosting
# Run from project root: .\deploy.ps1

param(
    [switch]$SkipFirestore,
    [switch]$SkipStorage,
    [switch]$SkipFunctions,
    [switch]$SkipHosting,
    [switch]$SkipScheduler,
    [switch]$NonInteractive
)

Write-Host "🚀 Geofranzy Firebase Deployment" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI installation..." -ForegroundColor Yellow
$firebaseVersion = firebase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Firebase CLI not installed" -ForegroundColor Red
    Write-Host "Install it with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Firebase CLI installed: $firebaseVersion" -ForegroundColor Green
Write-Host ""

# Check if logged in to Firebase
Write-Host "Checking Firebase authentication..." -ForegroundColor Yellow
$firebaseProjects = firebase projects:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Firebase" -ForegroundColor Red
    Write-Host "Run: firebase login" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Logged in to Firebase" -ForegroundColor Green
Write-Host ""

# Load project ID from .firebaserc
$projectId = $null
if (Test-Path ".firebaserc") {
    try {
        $projectId = (Get-Content .firebaserc | ConvertFrom-Json).projects.default
    } catch {
        $projectId = $null
    }
}

$projectArg = @()
if ($projectId) {
    $projectArg = @("--project", $projectId)
    Write-Host "Project: $projectId" -ForegroundColor Green
    Write-Host ""
}

if (-not (Test-Path "firebase.json")) {
    Write-Host "❌ firebase.json not found. Run from project root." -ForegroundColor Red
    exit 1
}

# Confirm deployment
Write-Host "This will deploy:" -ForegroundColor Yellow
if (-not $SkipFirestore) {
    Write-Host "  • Firestore security rules + indexes" -ForegroundColor White
}
if (-not $SkipStorage) {
    Write-Host "  • Firebase Storage rules" -ForegroundColor White
}
if (-not $SkipFunctions) {
    Write-Host "  • Cloud Functions (9 functions)" -ForegroundColor White
}
if (-not $SkipHosting) {
    Write-Host "  • Web build + Firebase Hosting" -ForegroundColor White
}
if (-not $SkipScheduler) {
    Write-Host "  • Cloud Scheduler setup (autoLogMeetings)" -ForegroundColor White
}
Write-Host ""
if (-not $NonInteractive) {
    $confirm = Read-Host "Continue with deployment? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "❌ Deployment cancelled" -ForegroundColor Red
        exit 0
    }
    Write-Host ""
}

$summary = @()

# Step 1: Deploy Firestore rules and indexes
if (-not $SkipFirestore) {
    Write-Host "📜 Deploying Firestore rules and indexes..." -ForegroundColor Cyan
    & firebase deploy --only firestore @projectArg
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to deploy Firestore rules/indexes" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Firestore rules and indexes deployed" -ForegroundColor Green
    $summary += "Firestore rules + indexes"
    Write-Host ""
}

# Step 2: Deploy Storage rules
if (-not $SkipStorage) {
    Write-Host "📦 Deploying Storage rules..." -ForegroundColor Cyan
    & firebase deploy --only storage @projectArg
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to deploy Storage rules" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Storage rules deployed" -ForegroundColor Green
    $summary += "Storage rules"
    Write-Host ""
}

# Step 3: Install Cloud Functions dependencies
if (-not $SkipFunctions) {
    Write-Host "📦 Installing Cloud Functions dependencies..." -ForegroundColor Cyan
    Push-Location firebase\functions
    npm install
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Pop-Location
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Step 4: Deploy Cloud Functions
if (-not $SkipFunctions) {
    Write-Host "☁️  Deploying Cloud Functions..." -ForegroundColor Cyan
    & firebase deploy --only functions @projectArg
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to deploy Cloud Functions" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Cloud Functions deployed" -ForegroundColor Green
    $summary += "Cloud Functions"
    Write-Host ""
}

# Step 5: Build web app + deploy Hosting
if (-not $SkipHosting) {
    if (-not (Test-Path "web\package.json")) {
        Write-Host "❌ web/package.json not found. Skipping hosting deploy." -ForegroundColor Red
        exit 1
    }

    Write-Host "🌐 Building web app..." -ForegroundColor Cyan
    Push-Location web
    npm install
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Host "❌ Failed to install web dependencies" -ForegroundColor Red
        exit 1
    }
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Host "❌ Failed to build web app" -ForegroundColor Red
        exit 1
    }
    Pop-Location
    Write-Host "✅ Web build complete" -ForegroundColor Green

    Write-Host "📡 Deploying to Firebase Hosting..." -ForegroundColor Cyan
    & firebase deploy --only hosting @projectArg
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to deploy Firebase Hosting" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Firebase Hosting deployed" -ForegroundColor Green
    $summary += "Web Hosting"
    Write-Host ""
}

# Step 6: Setup Cloud Scheduler (optional)
if (-not $SkipScheduler) {
    if (Test-Path ".\setup-scheduler.ps1") {
        Write-Host "⏰ Configuring Cloud Scheduler..." -ForegroundColor Cyan
        & .\setup-scheduler.ps1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Cloud Scheduler setup failed. You can retry later." -ForegroundColor Yellow
        } else {
            $summary += "Cloud Scheduler"
        }
        Write-Host ""
    } else {
        Write-Host "⚠️  setup-scheduler.ps1 not found. Skipping scheduler setup." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Summary
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployed resources:" -ForegroundColor Yellow
if ($summary.Count -eq 0) {
    Write-Host "  (No deployment steps were executed)" -ForegroundColor Yellow
} else {
    foreach ($item in $summary) {
        Write-Host "  ✅ $item" -ForegroundColor Green
    }
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test your deployment" -ForegroundColor White
Write-Host "     Run: npm run start" -ForegroundColor Cyan
Write-Host "" 
Write-Host "View your Firebase console at:" -ForegroundColor Yellow
Write-Host "  https://console.firebase.google.com/project/geofrenzy" -ForegroundColor Cyan
Write-Host ""

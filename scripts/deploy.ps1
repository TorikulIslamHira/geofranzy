# Geofranzy Firebase Deployment Script
# This script deploys all Firebase resources
# Run from project root: .\deploy.ps1

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

# Confirm deployment
Write-Host "This will deploy:" -ForegroundColor Yellow
Write-Host "  • Firestore security rules" -ForegroundColor White
Write-Host "  • Firestore indexes" -ForegroundColor White
Write-Host "  • Firebase Storage rules" -ForegroundColor White
Write-Host "  • Cloud Functions (9 functions)" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Continue with deployment? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 0
}
Write-Host ""

# Step 1: Deploy Firestore rules and indexes
Write-Host "📜 Deploying Firestore rules and indexes..." -ForegroundColor Cyan
firebase deploy --only firestore
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy Firestore rules/indexes" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Firestore rules and indexes deployed" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy Storage rules
Write-Host "📦 Deploying Storage rules..." -ForegroundColor Cyan
firebase deploy --only storage
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy Storage rules" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Storage rules deployed" -ForegroundColor Green
Write-Host ""

# Step 3: Install Cloud Functions dependencies
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

# Step 4: Deploy Cloud Functions
Write-Host "☁️  Deploying Cloud Functions..." -ForegroundColor Cyan
firebase deploy --only functions
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy Cloud Functions" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Cloud Functions deployed" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployed resources:" -ForegroundColor Yellow
Write-Host "  ✅ Firestore security rules" -ForegroundColor Green
Write-Host "  ✅ Firestore indexes (8 composite indexes)" -ForegroundColor Green
Write-Host "  ✅ Firebase Storage rules" -ForegroundColor Green
Write-Host "  ✅ Cloud Functions (9 functions):" -ForegroundColor Green
Write-Host "     • handleLocationUpdate" -ForegroundColor White
Write-Host "     • broadcastSOSAlert" -ForegroundColor White
Write-Host "     • resolveSOSAlert" -ForegroundColor White
Write-Host "     • notifyFriendRequest" -ForegroundColor White
Write-Host "     • notifyFriendRequestAccepted" -ForegroundColor White
Write-Host "     • autoLogMeetings (scheduled)" -ForegroundColor White
Write-Host "     • initializeUserProfile" -ForegroundColor White
Write-Host "     • cleanupUserData" -ForegroundColor White
Write-Host "     • notifyWeatherShare" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Set up Cloud Scheduler for autoLogMeetings function" -ForegroundColor White
Write-Host "     Run: .\setup-scheduler.ps1" -ForegroundColor Cyan
Write-Host "  2. Test your deployment" -ForegroundColor White
Write-Host "     Run: npm run start" -ForegroundColor Cyan
Write-Host ""
Write-Host "View your Firebase console at:" -ForegroundColor Yellow
Write-Host "  https://console.firebase.google.com/project/geofranzy" -ForegroundColor Cyan
Write-Host ""

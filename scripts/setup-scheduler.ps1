# Geofranzy Cloud Scheduler Setup Script
# This script sets up Cloud Scheduler for scheduled functions
# Run from project root: .\setup-scheduler.ps1

Write-Host "⏰ Geofranzy Cloud Scheduler Setup" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Get project ID
$projectId = (Get-Content .firebaserc | ConvertFrom-Json).projects.default
if (-not $projectId) {
    Write-Host "❌ Could not find project ID in .firebaserc" -ForegroundColor Red
    exit 1
}
Write-Host "📦 Project ID: $projectId" -ForegroundColor Green
Write-Host ""

# Check if gcloud is installed
Write-Host "Checking gcloud CLI installation..." -ForegroundColor Yellow
$gcloudVersion = gcloud --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ gcloud CLI not installed" -ForegroundColor Red
    Write-Host "Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ gcloud CLI installed" -ForegroundColor Green
Write-Host ""

# Set project
Write-Host "Setting gcloud project..." -ForegroundColor Yellow
gcloud config set project $projectId
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set project" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Project set to $projectId" -ForegroundColor Green
Write-Host ""

# Enable Cloud Scheduler API
Write-Host "Enabling Cloud Scheduler API..." -ForegroundColor Yellow
gcloud services enable cloudscheduler.googleapis.com
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to enable Cloud Scheduler API" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Cloud Scheduler API enabled" -ForegroundColor Green
Write-Host ""

# Create Cloud Scheduler job for autoLogMeetings (runs every 5 minutes)
Write-Host "Creating Cloud Scheduler job for autoLogMeetings..." -ForegroundColor Cyan
$schedulerName = "auto-log-meetings"
$region = "us-central1"  # Change if your functions are in a different region
$functionUrl = "https://$region-$projectId.cloudfunctions.net/autoLogMeetings"

# Check if job already exists
$existingJob = gcloud scheduler jobs list --filter="name:$schedulerName" --format="value(name)" 2>&1
if ($existingJob) {
    Write-Host "⚠️  Scheduler job already exists. Updating..." -ForegroundColor Yellow
    gcloud scheduler jobs update http $schedulerName `
        --schedule="*/5 * * * *" `
        --uri=$functionUrl `
        --http-method=POST `
        --location=$region `
        --oidc-service-account-email="$projectId@appspot.gserviceaccount.com"
} else {
    Write-Host "Creating new scheduler job..." -ForegroundColor Yellow
    gcloud scheduler jobs create http $schedulerName `
        --schedule="*/5 * * * *" `
        --uri=$functionUrl `
        --http-method=POST `
        --location=$region `
        --oidc-service-account-email="$projectId@appspot.gserviceaccount.com" `
        --time-zone="America/New_York"  # Change to your timezone
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create/update scheduler job" -ForegroundColor Red
    Write-Host "You may need to manually create it in the Cloud Console" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Cloud Scheduler job created/updated" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "✅ Cloud Scheduler Setup Complete!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Scheduler job details:" -ForegroundColor Yellow
Write-Host "  • Name: $schedulerName" -ForegroundColor White
Write-Host "  • Schedule: Every 5 minutes (*/5 * * * *)" -ForegroundColor White
Write-Host "  • Function: autoLogMeetings" -ForegroundColor White
Write-Host "  • Region: $region" -ForegroundColor White
Write-Host ""
Write-Host "To view/manage your scheduled jobs:" -ForegroundColor Yellow
Write-Host "  https://console.cloud.google.com/cloudscheduler?project=$projectId" -ForegroundColor Cyan
Write-Host ""
Write-Host "To test the scheduler manually:" -ForegroundColor Yellow
Write-Host "  gcloud scheduler jobs run $schedulerName --location=$region" -ForegroundColor Cyan
Write-Host ""

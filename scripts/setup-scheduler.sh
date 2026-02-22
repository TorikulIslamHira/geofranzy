#!/bin/bash

# Geofranzy Cloud Scheduler Setup Script
# This script sets up Cloud Scheduler for scheduled functions
# Run from project root: ./setup-scheduler.sh

echo -e "\033[1;36m⏰ Geofranzy Cloud Scheduler Setup\033[0m"
echo -e "\033[1;36m===================================\033[0m"
echo ""

# Get project ID
PROJECT_ID=$(cat .firebaserc | grep -oP '(?<="default": ")[^"]*')
if [ -z "$PROJECT_ID" ]; then
    echo -e "\033[1;31m❌ Could not find project ID in .firebaserc\033[0m"
    exit 1
fi
echo -e "\033[1;32m📦 Project ID: $PROJECT_ID\033[0m"
echo ""

# Check if gcloud is installed
echo -e "\033[1;33mChecking gcloud CLI installation...\033[0m"
if ! command -v gcloud &> /dev/null; then
    echo -e "\033[1;31m❌ gcloud CLI not installed\033[0m"
    echo -e "\033[1;33mInstall from: https://cloud.google.com/sdk/docs/install\033[0m"
    exit 1
fi
echo -e "\033[1;32m✅ gcloud CLI installed\033[0m"
echo ""

# Set project
echo -e "\033[1;33mSetting gcloud project...\033[0m"
if ! gcloud config set project $PROJECT_ID; then
    echo -e "\033[1;31m❌ Failed to set project\033[0m"
    exit 1
fi
echo -e "\033[1;32m✅ Project set to $PROJECT_ID\033[0m"
echo ""

# Enable Cloud Scheduler API
echo -e "\033[1;33mEnabling Cloud Scheduler API...\033[0m"
if ! gcloud services enable cloudscheduler.googleapis.com; then
    echo -e "\033[1;31m❌ Failed to enable Cloud Scheduler API\033[0m"
    exit 1
fi
echo -e "\033[1;32m✅ Cloud Scheduler API enabled\033[0m"
echo ""

# Create Cloud Scheduler job for autoLogMeetings (runs every 5 minutes)
echo -e "\033[1;36mCreating Cloud Scheduler job for autoLogMeetings...\033[0m"
SCHEDULER_NAME="auto-log-meetings"
REGION="us-central1"  # Change if your functions are in a different region
FUNCTION_URL="https://$REGION-$PROJECT_ID.cloudfunctions.net/autoLogMeetings"

# Check if job already exists
if gcloud scheduler jobs list --filter="name:$SCHEDULER_NAME" --format="value(name)" | grep -q "$SCHEDULER_NAME"; then
    echo -e "\033[1;33m⚠️  Scheduler job already exists. Updating...\033[0m"
    gcloud scheduler jobs update http $SCHEDULER_NAME \
        --schedule="*/5 * * * *" \
        --uri=$FUNCTION_URL \
        --http-method=POST \
        --location=$REGION \
        --oidc-service-account-email="$PROJECT_ID@appspot.gserviceaccount.com"
else
    echo -e "\033[1;33mCreating new scheduler job...\033[0m"
    gcloud scheduler jobs create http $SCHEDULER_NAME \
        --schedule="*/5 * * * *" \
        --uri=$FUNCTION_URL \
        --http-method=POST \
        --location=$REGION \
        --oidc-service-account-email="$PROJECT_ID@appspot.gserviceaccount.com" \
        --time-zone="America/New_York"  # Change to your timezone
fi

if [ $? -ne 0 ]; then
    echo -e "\033[1;31m❌ Failed to create/update scheduler job\033[0m"
    echo -e "\033[1;33mYou may need to manually create it in the Cloud Console\033[0m"
    exit 1
fi
echo -e "\033[1;32m✅ Cloud Scheduler job created/updated\033[0m"
echo ""

# Summary
echo -e "\033[1;36m===================================\033[0m"
echo -e "\033[1;32m✅ Cloud Scheduler Setup Complete!\033[0m"
echo -e "\033[1;36m===================================\033[0m"
echo ""
echo -e "\033[1;33mScheduler job details:\033[0m"
echo -e "  • Name: $SCHEDULER_NAME"
echo -e "  • Schedule: Every 5 minutes (*/5 * * * *)"
echo -e "  • Function: autoLogMeetings"
echo -e "  • Region: $REGION"
echo ""
echo -e "\033[1;33mTo view/manage your scheduled jobs:\033[0m"
echo -e "\033[1;36m  https://console.cloud.google.com/cloudscheduler?project=$PROJECT_ID\033[0m"
echo ""
echo -e "\033[1;33mTo test the scheduler manually:\033[0m"
echo -e "\033[1;36m  gcloud scheduler jobs run $SCHEDULER_NAME --location=$REGION\033[0m"
echo ""

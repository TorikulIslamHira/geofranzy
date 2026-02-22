#!/bin/bash

# Geofranzy Firebase Deployment Script
# This script deploys Firebase resources and web hosting
# Run from project root: ./deploy.sh

SKIP_FIRESTORE=false
SKIP_STORAGE=false
SKIP_FUNCTIONS=false
SKIP_HOSTING=false
SKIP_SCHEDULER=false
NON_INTERACTIVE=false
PROJECT_ID=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-firestore)
            SKIP_FIRESTORE=true
            ;;
        --skip-storage)
            SKIP_STORAGE=true
            ;;
        --skip-functions)
            SKIP_FUNCTIONS=true
            ;;
        --skip-hosting)
            SKIP_HOSTING=true
            ;;
        --skip-scheduler)
            SKIP_SCHEDULER=true
            ;;
        --non-interactive)
            NON_INTERACTIVE=true
            ;;
        --project)
            PROJECT_ID="$2"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./deploy.sh [--skip-firestore] [--skip-storage] [--skip-functions] [--skip-hosting] [--skip-scheduler] [--non-interactive] [--project <id>]"
            exit 1
            ;;
    esac
    shift
done

echo -e "\033[1;36m🚀 Geofranzy Firebase Deployment\033[0m"
echo -e "\033[1;36m=================================\033[0m"
echo ""

# Check if Firebase CLI is installed
echo -e "\033[1;33mChecking Firebase CLI installation...\033[0m"
if ! command -v firebase &> /dev/null; then
    echo -e "\033[1;31m❌ Firebase CLI not installed\033[0m"
    echo -e "\033[1;33mInstall it with: npm install -g firebase-tools\033[0m"
    exit 1
fi
FIREBASE_VERSION=$(firebase --version)
echo -e "\033[1;32m✅ Firebase CLI installed: $FIREBASE_VERSION\033[0m"
echo ""

# Check if logged in to Firebase
echo -e "\033[1;33mChecking Firebase authentication...\033[0m"
if ! firebase projects:list &> /dev/null; then
    echo -e "\033[1;31m❌ Not logged in to Firebase\033[0m"
    echo -e "\033[1;33mRun: firebase login\033[0m"
    exit 1
fi
echo -e "\033[1;32m✅ Logged in to Firebase\033[0m"
echo ""

# Load project ID from .firebaserc if not provided
if [ -z "$PROJECT_ID" ] && [ -f ".firebaserc" ]; then
    PROJECT_ID=$(cat .firebaserc | grep -oP '(?<="default": ")[^"]*')
fi

FIREBASE_PROJECT_ARGS=()
if [ -n "$PROJECT_ID" ]; then
    FIREBASE_PROJECT_ARGS=(--project "$PROJECT_ID")
    echo -e "\033[1;32mProject: $PROJECT_ID\033[0m"
    echo ""
fi

if [ ! -f "firebase.json" ]; then
    echo -e "\033[1;31m❌ firebase.json not found. Run from project root.\033[0m"
    exit 1
fi

# Confirm deployment
echo -e "\033[1;33mThis will deploy:\033[0m"
if [ "$SKIP_FIRESTORE" = false ]; then
    echo -e "  • Firestore security rules + indexes"
fi
if [ "$SKIP_STORAGE" = false ]; then
    echo -e "  • Firebase Storage rules"
fi
if [ "$SKIP_FUNCTIONS" = false ]; then
    echo -e "  • Cloud Functions (9 functions)"
fi
if [ "$SKIP_HOSTING" = false ]; then
    echo -e "  • Web build + Firebase Hosting"
fi
if [ "$SKIP_SCHEDULER" = false ]; then
    echo -e "  • Cloud Scheduler setup (autoLogMeetings)"
fi
echo ""
if [ "$NON_INTERACTIVE" = false ]; then
    read -p "Continue with deployment? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo -e "\033[1;31m❌ Deployment cancelled\033[0m"
        exit 0
    fi
    echo ""
fi

SUMMARY=()

# Step 1: Deploy Firestore rules and indexes
if [ "$SKIP_FIRESTORE" = false ]; then
    echo -e "\033[1;36m📜 Deploying Firestore rules and indexes...\033[0m"
    if ! firebase deploy --only firestore "${FIREBASE_PROJECT_ARGS[@]}"; then
        echo -e "\033[1;31m❌ Failed to deploy Firestore rules/indexes\033[0m"
        exit 1
    fi
    echo -e "\033[1;32m✅ Firestore rules and indexes deployed\033[0m"
    SUMMARY+=("Firestore rules + indexes")
    echo ""
fi

# Step 2: Deploy Storage rules
if [ "$SKIP_STORAGE" = false ]; then
    echo -e "\033[1;36m📦 Deploying Storage rules...\033[0m"
    if ! firebase deploy --only storage "${FIREBASE_PROJECT_ARGS[@]}"; then
        echo -e "\033[1;31m❌ Failed to deploy Storage rules\033[0m"
        exit 1
    fi
    echo -e "\033[1;32m✅ Storage rules deployed\033[0m"
    SUMMARY+=("Storage rules")
    echo ""
fi

# Step 3: Install Cloud Functions dependencies
if [ "$SKIP_FUNCTIONS" = false ]; then
    echo -e "\033[1;36m📦 Installing Cloud Functions dependencies...\033[0m"
    cd firebase/functions
    if ! npm install; then
        cd ../..
        echo -e "\033[1;31m❌ Failed to install dependencies\033[0m"
        exit 1
    fi
    cd ../..
    echo -e "\033[1;32m✅ Dependencies installed\033[0m"
    echo ""
fi

# Step 4: Deploy Cloud Functions
if [ "$SKIP_FUNCTIONS" = false ]; then
    echo -e "\033[1;36m☁️  Deploying Cloud Functions...\033[0m"
    if ! firebase deploy --only functions "${FIREBASE_PROJECT_ARGS[@]}"; then
        echo -e "\033[1;31m❌ Failed to deploy Cloud Functions\033[0m"
        exit 1
    fi
    echo -e "\033[1;32m✅ Cloud Functions deployed\033[0m"
    SUMMARY+=("Cloud Functions")
    echo ""
fi

# Step 5: Build web app + deploy Hosting
if [ "$SKIP_HOSTING" = false ]; then
    if [ ! -f "web/package.json" ]; then
        echo -e "\033[1;31m❌ web/package.json not found. Skipping hosting deploy.\033[0m"
        exit 1
    fi

    echo -e "\033[1;36m🌐 Building web app...\033[0m"
    cd web
    if ! npm install; then
        cd ..
        echo -e "\033[1;31m❌ Failed to install web dependencies\033[0m"
        exit 1
    fi
    if ! npm run build; then
        cd ..
        echo -e "\033[1;31m❌ Failed to build web app\033[0m"
        exit 1
    fi
    cd ..
    echo -e "\033[1;32m✅ Web build complete\033[0m"

    echo -e "\033[1;36m📡 Deploying to Firebase Hosting...\033[0m"
    if ! firebase deploy --only hosting "${FIREBASE_PROJECT_ARGS[@]}"; then
        echo -e "\033[1;31m❌ Failed to deploy Firebase Hosting\033[0m"
        exit 1
    fi
    echo -e "\033[1;32m✅ Firebase Hosting deployed\033[0m"
    SUMMARY+=("Web Hosting")
    echo ""
fi

# Step 6: Setup Cloud Scheduler (optional)
if [ "$SKIP_SCHEDULER" = false ]; then
    if [ -f "./setup-scheduler.sh" ]; then
        echo -e "\033[1;36m⏰ Configuring Cloud Scheduler...\033[0m"
        if ! ./setup-scheduler.sh; then
            echo -e "\033[1;33m⚠️  Cloud Scheduler setup failed. You can retry later.\033[0m"
        else
            SUMMARY+=("Cloud Scheduler")
        fi
        echo ""
    else
        echo -e "\033[1;33m⚠️  setup-scheduler.sh not found. Skipping scheduler setup.\033[0m"
        echo ""
    fi
fi

# Summary
echo -e "\033[1;36m=================================\033[0m"
echo -e "\033[1;32m✅ Deployment Complete!\033[0m"
echo -e "\033[1;36m=================================\033[0m"
echo ""
echo -e "\033[1;33mDeployed resources:\033[0m"
if [ ${#SUMMARY[@]} -eq 0 ]; then
    echo -e "\033[1;33m  (No deployment steps were executed)\033[0m"
else
    for item in "${SUMMARY[@]}"; do
        echo -e "\033[1;32m  ✅ $item\033[0m"
    done
fi
echo ""
echo -e "\033[1;33mNext steps:\033[0m"
echo -e "  1. Test your deployment"
echo -e "\033[1;36m     Run: npm run start\033[0m"
echo ""
echo -e "\033[1;33mView your Firebase console at:\033[0m"
echo -e "\033[1;36m  https://console.firebase.google.com/project/geofrenzy\033[0m"
echo ""

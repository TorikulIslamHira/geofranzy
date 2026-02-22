#!/bin/bash

# Geofranzy Firebase Deployment Script
# This script deploys all Firebase resources
# Run from project root: ./deploy.sh

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

# Confirm deployment
echo -e "\033[1;33mThis will deploy:\033[0m"
echo -e "  • Firestore security rules"
echo -e "  • Firestore indexes"
echo -e "  • Firebase Storage rules"
echo -e "  • Cloud Functions (9 functions)"
echo ""
read -p "Continue with deployment? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo -e "\033[1;31m❌ Deployment cancelled\033[0m"
    exit 0
fi
echo ""

# Step 1: Deploy Firestore rules and indexes
echo -e "\033[1;36m📜 Deploying Firestore rules and indexes...\033[0m"
if ! firebase deploy --only firestore; then
    echo -e "\033[1;31m❌ Failed to deploy Firestore rules/indexes\033[0m"
    exit 1
fi
echo -e "\033[1;32m✅ Firestore rules and indexes deployed\033[0m"
echo ""

# Step 2: Deploy Storage rules
echo -e "\033[1;36m📦 Deploying Storage rules...\033[0m"
if ! firebase deploy --only storage; then
    echo -e "\033[1;31m❌ Failed to deploy Storage rules\033[0m"
    exit 1
fi
echo -e "\033[1;32m✅ Storage rules deployed\033[0m"
echo ""

# Step 3: Install Cloud Functions dependencies
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

# Step 4: Deploy Cloud Functions
echo -e "\033[1;36m☁️  Deploying Cloud Functions...\033[0m"
if ! firebase deploy --only functions; then
    echo -e "\033[1;31m❌ Failed to deploy Cloud Functions\033[0m"
    exit 1
fi
echo -e "\033[1;32m✅ Cloud Functions deployed\033[0m"
echo ""

# Summary
echo -e "\033[1;36m=================================\033[0m"
echo -e "\033[1;32m✅ Deployment Complete!\033[0m"
echo -e "\033[1;36m=================================\033[0m"
echo ""
echo -e "\033[1;33mDeployed resources:\033[0m"
echo -e "\033[1;32m  ✅ Firestore security rules\033[0m"
echo -e "\033[1;32m  ✅ Firestore indexes (8 composite indexes)\033[0m"
echo -e "\033[1;32m  ✅ Firebase Storage rules\033[0m"
echo -e "\033[1;32m  ✅ Cloud Functions (9 functions):\033[0m"
echo -e "     • handleLocationUpdate"
echo -e "     • broadcastSOSAlert"
echo -e "     • resolveSOSAlert"
echo -e "     • notifyFriendRequest"
echo -e "     • notifyFriendRequestAccepted"
echo -e "     • autoLogMeetings (scheduled)"
echo -e "     • initializeUserProfile"
echo -e "     • cleanupUserData"
echo -e "     • notifyWeatherShare"
echo ""
echo -e "\033[1;33mNext steps:\033[0m"
echo -e "  1. Set up Cloud Scheduler for autoLogMeetings function"
echo -e "\033[1;36m     Run: ./setup-scheduler.sh\033[0m"
echo -e "  2. Test your deployment"
echo -e "\033[1;36m     Run: npm run start\033[0m"
echo ""
echo -e "\033[1;33mView your Firebase console at:\033[0m"
echo -e "\033[1;36m  https://console.firebase.google.com/project/geofranzy\033[0m"
echo ""

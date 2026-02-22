#!/bin/bash
# GeoFrenzy Web Deployment Script
# Deploys web app to Firebase Hosting

set -e

PROJECT_ID="geofrenzy-28807"
ENVIRONMENT="${1:-staging}"

echo "🚀 GeoFrenzy Web Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: $ENVIRONMENT"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check authentication
echo "🔐 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "📝 Please login to Firebase"
    firebase login
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm test -- --no-coverage --passWithNoTests || echo "⚠️  Tests had issues but continuing deployment..."

# Build web app
echo "🏗️  Building web app..."
cd web
npm run build
cd ..

if [ "$ENVIRONMENT" = "production" ]; then
    # Verify production deployment
    read -p "⚠️  Deploy to PRODUCTION? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
    
    echo "📤 Deploying Firestore rules..."
    firebase deploy --only firestore:rules --project $PROJECT_ID
    
    echo "📤 Deploying Cloud Functions..."
    firebase deploy --only functions --project $PROJECT_ID
    
    echo "📤 Deploying web app to production..."
    firebase deploy --only hosting:default --project $PROJECT_ID
    
    echo ""
    echo "✅ Production deployment complete!"
    echo "🌍 Live at: https://geofrenzy.web.app"
    
elif [ "$ENVIRONMENT" = "staging" ]; then
    echo "📤 Deploying to staging..."
    firebase deploy --only hosting:staging --project $PROJECT_ID || firebase hosting:channel:deploy staging --project $PROJECT_ID
    
    echo ""
    echo "✅ Staging deployment complete!"
    echo "🌍 Preview at: https://staging.geofrenzy.web.app"
    
else
    echo "❌ Unknown environment: $ENVIRONMENT"
    echo "Usage: ./deploy-web.sh [staging|production]"
    exit 1
fi

echo ""
echo "📊 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━"
echo "Project: $PROJECT_ID"
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"

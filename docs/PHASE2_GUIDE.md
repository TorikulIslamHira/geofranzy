# Phase 2: Firebase Backend Setup Guide

**Status**: Ready for Implementation  
**Estimated Time**: 1-2 hours  
**Prerequisites**: Phase 1 Complete, Firebase account, Node.js 18+

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)
6. [What's Included](#whats-included)

---

## Overview

Phase 2 focuses on deploying your Firebase backend infrastructure:

- ✅ Firestore security rules (6 collections)
- ✅ Firestore composite indexes (8 indexes)
- ✅ Firebase Storage rules (profile photos, shared images)
- ✅ Cloud Functions deployment (9 functions)
- ✅ Cloud Scheduler setup (auto-log meetings)

**No code changes required** - all backend infrastructure is ready to deploy!

---

## Prerequisites

### 1. Required Tools

- **Node.js 18+**: `node --version`
- **npm**: `npm --version`
- **Firebase CLI**: Install with `npm install -g firebase-tools`
- **Google Cloud SDK** (for Cloud Scheduler): [Install Guide](https://cloud.google.com/sdk/docs/install)

### 2. Firebase Project Setup

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. **Project name**: `geofranzy` (or your preferred name)
4. **Enable Google Analytics**: Optional (recommended for production)
5. Click "Create project"

#### Enable Required Services

Once your project is created, enable these services:

**Authentication**
1. Go to **Build** → **Authentication**
2. Click "Get started"
3. Enable **Email/Password** provider
4. Click "Save"

**Firestore Database**
1. Go to **Build** → **Firestore Database**
2. Click "Create database"
3. Select **Start in production mode** (we'll deploy our own rules)
4. Choose a location (e.g., `us-central1`)
5. Click "Enable"

**Storage**
1. Go to **Build** → **Storage**
2. Click "Get started"
3. Select **Start in production mode**
4. Use same location as Firestore
5. Click "Done"

**Cloud Functions**
1. Go to **Build** → **Functions**
2. Click "Get started"
3. Click "Upgrade project" to **Blaze (Pay as you go)** plan
   - ⚠️ **Note**: Cloud Functions require the Blaze plan, but it has a generous free tier
   - Free tier: 2M invocations/month, 400K GB-seconds/month
4. Click "Continue"

**Cloud Messaging (FCM)**
1. Go to **Build** → **Cloud Messaging**
2. Click "Get started"
3. No additional setup needed (automatically enabled)

---

## Step-by-Step Setup

### Step 1: Login to Firebase CLI

Open your terminal in the project root directory and run:

```bash
firebase login
```

- This will open your browser
- Sign in with your Google account
- Grant Firebase CLI permissions
- Return to terminal

Verify login:
```bash
firebase projects:list
```

You should see your `geofranzy` project listed.

### Step 2: Link Project to Firebase

Check if your project is already linked:

```bash
cat .firebaserc
```

You should see:
```json
{
  "projects": {
    "default": "geofranzy"
  }
}
```

If the project name is different or missing, update it:

```bash
firebase use --add
```

- Select your project from the list
- Give it an alias: `default`

### Step 3: Update Firebase Configuration in App

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `geofranzy` project
3. Click the **gear icon** → **Project settings**
4. Scroll down to "Your apps"
5. Click **Web app icon** (</>) to add a web app
6. **App nickname**: `geofranzy-mobile`
7. **Do NOT** check "Firebase Hosting"
8. Click "Register app"
9. **Copy the config object**

Example config:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "geofranzy.firebaseapp.com",
  projectId: "geofranzy",
  storageBucket: "geofranzy.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

10. Create a `.env` file in the project root:

```bash
# Windows PowerShell
New-Item -Path .env -ItemType File

# macOS/Linux
touch .env
```

11. Add your Firebase config to `.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=geofranzy.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=geofranzy
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=geofranzy.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://geofranzy.firebaseio.com
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key_here
```

**Get OpenWeather API Key** (for weather features):
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Go to **API keys** tab
4. Copy your API key
5. Add it to `.env` as `EXPO_PUBLIC_OPENWEATHER_API_KEY`

### Step 4: Deploy Firebase Backend

Now deploy all Firebase resources using the automated deployment scripts:

**Windows PowerShell:**
```powershell
.\deploy.ps1
```

**macOS/Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

This script will:
1. ✅ Verify Firebase CLI installation
2. ✅ Check Firebase authentication
3. ✅ Deploy Firestore security rules
4. ✅ Deploy Firestore indexes
5. ✅ Deploy Storage rules
6. ✅ Install Cloud Functions dependencies
7. ✅ Deploy all 9 Cloud Functions

**Expected Output:**
```
🚀 Geofranzy Firebase Deployment
=================================

Checking Firebase CLI installation...
✅ Firebase CLI installed: 13.0.0

Checking Firebase authentication...
✅ Logged in to Firebase

This will deploy:
  • Firestore security rules
  • Firestore indexes
  • Firebase Storage rules
  • Cloud Functions (9 functions)

Continue with deployment? (y/N): y

📜 Deploying Firestore rules and indexes...
✅ Firestore rules and indexes deployed

📦 Deploying Storage rules...
✅ Storage rules deployed

📦 Installing Cloud Functions dependencies...
✅ Dependencies installed

☁️  Deploying Cloud Functions...
✅ Cloud Functions deployed

=================================
✅ Deployment Complete!
=================================
```

**Deployment Time**: 
- First time: 5-10 minutes
- Subsequent deploys: 2-5 minutes

### Step 5: Set Up Cloud Scheduler (Optional but Recommended)

Cloud Scheduler automatically runs the `autoLogMeetings` function every 5 minutes to detect and log meetings between nearby friends.

**Windows PowerShell:**
```powershell
.\setup-scheduler.ps1
```

**macOS/Linux:**
```bash
chmod +x setup-scheduler.sh
./setup-scheduler.sh
```

This script will:
1. ✅ Enable Cloud Scheduler API
2. ✅ Create scheduled job for `autoLogMeetings`
3. ✅ Configure 5-minute cron schedule

**Expected Output:**
```
⏰ Geofranzy Cloud Scheduler Setup
===================================

📦 Project ID: geofranzy

Enabling Cloud Scheduler API...
✅ Cloud Scheduler API enabled

Creating Cloud Scheduler job for autoLogMeetings...
✅ Cloud Scheduler job created/updated

===================================
✅ Cloud Scheduler Setup Complete!
===================================
```

**Note**: If this fails, you can manually create the scheduler in the [Cloud Console](https://console.cloud.google.com/cloudscheduler).

---

## Verification

### 1. Verify Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules**
4. You should see 150+ lines of security rules
5. Status should show **Published**

### 2. Verify Firestore Indexes

1. In Firestore, go to **Indexes** tab
2. You should see **8 composite indexes**:
   - `friends` (userId, status)
   - `friends` (friendId, status)
   - `locations` (userId, timestamp)
   - `sos_alerts` (status, timestamp)
   - `sos_alerts` (userId, timestamp)
   - `meeting_history` (user1Id, meetingTime)
   - `meeting_history` (user2Id, meetingTime)
   - `weather` (userId, timestamp)
3. Status should be **Enabled** (may take a few minutes to build)

### 3. Verify Storage Rules

1. Go to **Storage** → **Rules**
2. You should see rules for:
   - `/profile-photos/{userId}/{fileName}`
   - `/shared-images/{userId}/{fileName}`
3. Status should show **Published**

### 4. Verify Cloud Functions

1. Go to **Functions**
2. You should see **9 functions** with status **Healthy**:
   - `handleLocationUpdate` (Firestore trigger)
   - `broadcastSOSAlert` (Firestore trigger)
   - `resolveSOSAlert` (Firestore trigger)
   - `notifyFriendRequest` (Firestore trigger)
   - `notifyFriendRequestAccepted` (Firestore trigger)
   - `autoLogMeetings` (HTTP/Scheduled)
   - `initializeUserProfile` (Auth trigger)
   - `cleanupUserData` (Auth trigger)
   - `notifyWeatherShare` (Firestore trigger)

### 5. Verify Cloud Scheduler (if set up)

1. Go to [Cloud Scheduler Console](https://console.cloud.google.com/cloudscheduler)
2. You should see `auto-log-meetings` job
3. Status: **Enabled**
4. Schedule: `*/5 * * * *` (every 5 minutes)

### 6. Test Your Deployment

Run the app locally:

```bash
npm install
npm run start
```

- Press `a` for Android emulator
- Press `i` for iOS simulator (macOS only)
- Scan QR code with Expo Go app on your device

Try these actions:
- ✅ Sign up with email/password
- ✅ Login with existing account
- ✅ Update profile (should trigger `initializeUserProfile`)
- ✅ Grant location permissions
- ✅ View map screen

Check Firebase Console:
- **Authentication** → Users (should see your test user)
- **Firestore** → `users` collection (should see your profile)
- **Functions** → Logs (should see function executions)

---

## Troubleshooting

### Issue: "Firebase CLI not found"

**Solution**:
```bash
npm install -g firebase-tools
```

Verify:
```bash
firebase --version
```

### Issue: "Not authenticated"

**Solution**:
```bash
firebase login --reauth
```

### Issue: "Permission denied" during deployment

**Solution**:
1. Ensure you're logged in: `firebase login`
2. Check project permissions in [IAM Console](https://console.cloud.google.com/iam-admin/iam)
3. You need **Editor** or **Owner** role

### Issue: Firestore indexes still "Building"

**Explanation**: Composite indexes can take 5-15 minutes to build on first deployment.

**Solution**: Wait and refresh the page. Check status:
```bash
firebase firestore:indexes
```

### Issue: Cloud Functions deployment fails

**Common causes**:
1. **Billing not enabled**: Upgrade to Blaze plan (required for Cloud Functions)
2. **Node version mismatch**: Ensure Node 18+ is installed
3. **Dependencies error**: Run `cd firebase/functions && npm install`

**Solution**:
```bash
cd firebase/functions
npm install
npm run build
cd ../..
firebase deploy --only functions
```

### Issue: Cloud Scheduler setup fails

**Solution**: Manually create in Cloud Console:
1. Go to [Cloud Scheduler](https://console.cloud.google.com/cloudscheduler)
2. Click "Create Job"
3. **Name**: `auto-log-meetings`
4. **Region**: `us-central1`
5. **Frequency**: `*/5 * * * *`
6. **Timezone**: Your timezone
7. **Target**: HTTP
8. **URL**: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/autoLogMeetings`
9. **HTTP method**: POST
10. **Auth header**: OIDC token
11. **Service account**: `YOUR_PROJECT_ID@appspot.gserviceaccount.com`
12. Click "Create"

### Issue: Functions show "Cold start" delays

**Explanation**: Cloud Functions "sleep" after inactivity and take 1-3 seconds to wake up.

**Solution** (for production):
- Upgrade to Cloud Functions Gen 2
- Use Cloud Scheduler to ping functions periodically
- Implement connection pooling

### Issue: ".env file not loading"

**Solution**:
1. Ensure `.env` is in project root (same level as `App.tsx`)
2. Restart Metro bundler: `npm run start` (press `r` to reload)
3. Clear cache: `npx expo start --clear`

---

## What's Included

### Phase 2 Files Created

```
geofranzy-rn/
├── firestore.rules           ✅ NEW - Firestore security rules (150+ lines)
├── firestore.indexes.json    ✅ NEW - 8 composite indexes
├── storage.rules             ✅ NEW - Storage security rules (60+ lines)
├── deploy.ps1                ✅ NEW - Windows deployment script
├── deploy.sh                 ✅ NEW - Unix deployment script
├── setup-scheduler.ps1       ✅ NEW - Windows scheduler setup
├── setup-scheduler.sh        ✅ NEW - Unix scheduler setup
└── PHASE2_GUIDE.md           ✅ NEW - This guide
```

### Deployed Resources

**Firestore Database**
- ✅ 6 collections (users, locations, friends, sos_alerts, meeting_history, weather)
- ✅ Security rules (150+ lines)
- ✅ 8 composite indexes

**Firebase Storage**
- ✅ `/profile-photos/` bucket
- ✅ `/shared-images/` bucket
- ✅ Security rules (60+ lines)

**Cloud Functions (9 total)**
- ✅ `handleLocationUpdate` - Proximity alerts
- ✅ `broadcastSOSAlert` - Emergency notifications
- ✅ `resolveSOSAlert` - SOS resolution
- ✅ `notifyFriendRequest` - Friend request alerts
- ✅ `notifyFriendRequestAccepted` - Acceptance notifications
- ✅ `autoLogMeetings` - Auto-log meetings (scheduled)
- ✅ `initializeUserProfile` - User initialization
- ✅ `cleanupUserData` - User cleanup
- ✅ `notifyWeatherShare` - Weather share alerts

**Cloud Scheduler**
- ✅ `auto-log-meetings` job (runs every 5 minutes)

---

## Cost Estimates (Blaze Plan)

### Free Tier (Monthly)

**Firestore**
- 50K reads, 20K writes, 20K deletes
- 1 GB storage

**Cloud Functions**
- 2M invocations
- 400K GB-seconds compute time
- 200K CPU-seconds

**Storage**
- 5 GB stored
- 1 GB/day downloads

**Cloud Scheduler**
- 3 jobs (free)

### Typical Usage (10-20 active users)
- **Firestore**: ~10K reads/day, ~2K writes/day → **FREE**
- **Cloud Functions**: ~50K invocations/month → **FREE**
- **Storage**: ~100 MB → **FREE**
- **Total Monthly Cost**: **$0** (within free tier)

### Production (1,000 users)
- **Firestore**: ~500K reads/day, ~100K writes/day → **~$5/month**
- **Cloud Functions**: ~2M invocations/month → **~$2/month**
- **Storage**: ~5 GB → **FREE**
- **Total Monthly Cost**: **~$7/month**

---

## Next Steps

### ✅ Phase 2 Complete!

You've successfully set up the Firebase backend. Your app now has:
- Secure database with proper access control
- Serverless Cloud Functions for backend logic
- Automated meeting logging every 5 minutes
- Push notification infrastructure
- Profile photo storage

### What's Next: Phase 3 (Optional Enhancements)

**Advanced UI/UX**
- [ ] Animated map markers
- [ ] Custom notification sounds
- [ ] Dark mode theme
- [ ] Splash screen animations

**Offline Support**
- [ ] Firestore offline persistence
- [ ] Cached location data
- [ ] Queue for failed requests

**Analytics & Monitoring**
- [ ] Firebase Analytics integration
- [ ] Crashlytics for error tracking
- [ ] Performance monitoring

**Social Features**
- [ ] Group location sharing
- [ ] Meeting point suggestions
- [ ] ETA calculations

### Testing Your App

1. **Development**: `npm run start`
2. **Build APK**: `eas build --platform android --profile preview`
3. **Build IPA**: `eas build --platform ios --profile preview` (macOS only)

See [SETUP.md](./SETUP.md) for detailed build instructions.

---

## Support & Resources

**Documentation**
- [Firebase Console](https://console.firebase.google.com/)
- [Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Expo Documentation](https://docs.expo.dev/)

**Monitoring**
- [Cloud Functions Logs](https://console.cloud.google.com/functions/list)
- [Firestore Usage](https://console.firebase.google.com/project/_/firestore/usage)
- [Error Reporting](https://console.cloud.google.com/errors)

**Community**
- [Firebase Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
- [Expo Forums](https://forums.expo.dev/)
- [React Native Community](https://www.reactnative.dev/help)

---

**Phase 2 Status**: ✅ READY TO DEPLOY  
**Estimated Completion Time**: 1-2 hours  
**Next Phase**: Phase 3 (Advanced Features) - Optional

---

*Generated: February 21, 2026*  
*Last Updated: February 21, 2026*

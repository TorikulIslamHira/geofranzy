# Geofranzy - Complete Setup Guide

Complete step-by-step guide to set up the Geofranzy app from scratch.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Firebase Project Setup](#firebase-project-setup)
3. [React Native App Setup](#react-native-app-setup)
4. [Environment Configuration](#environment-configuration)
5. [Cloud Functions Setup](#cloud-functions-setup)
6. [Running the App](#running-the-app)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## Prerequisites

### Required Software
- **Node.js** 18+ and npm (download from [nodejs.org](https://nodejs.org))
- **Git** (download from [git-scm.com](https://git-scm.com))
- **Java Development Kit (JDK)** 17+ (for Android development)
- **Android Studio** or Android SDK (for Android testing)
- **Xcode** 14+ (macOS only, for iOS development)

### Required Accounts
- Google account (for Firebase)
- OpenWeatherMap account (free tier)
- (Optional) Apple Developer account (for iOS App Store)
- (Optional) Google Play Developer account (for Google Play Store)

### Verify Installation

```bash
node --version     # Should be v18+
npm --version      # Should be 9+
git --version      # Should be 2.30+
```

---

## Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"**
3. Project name: `geofranzy`
4. Accept terms and click **"Continue"**
5. Disable Google Analytics (optional, can enable later)
6. Click **"Create project"**
7. Wait for project to be created (~1 min)

### Step 2: Enable Required Services

#### Authentication
1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **"Get started"**
3. Under **Sign-in method**, click **"Email/Password"**
4. Enable **"Email/Password"** toggle
5. Click **"Save"**

#### Firestore Database
1. Go to **Firestore Database** (left sidebar)
2. Click **"Create database"**
3. Choose region closest to you (e.g., `us-east1`)
4. Start in **"Test mode"** (we'll set up rules later)
5. Click **"Create"**
6. Wait for initialization (~2 min)

#### Cloud Storage
1. Go to **Cloud Storage** (left sidebar)
2. Click **"Get started"**
3. Default settings are fine
4. Click **"Done"**

#### Cloud Messaging
1. Go to **Cloud Messaging** (left sidebar)
2. Click the 3-dot menu → **"Manage API"**
3. Click **"Enable"** (if not already enabled)

#### Cloud Functions
1. Go to **Cloud Functions** (left sidebar)
2. Click **"Get started"**
3. Select region (same as Firestore, e.g., `us-east1`)
4. Click **"Continue"**
5. Select **"Firestore"** as trigger
6. Click **"Create function"**
7. Delete this sample function (we'll add our own)

### Step 3: Get Firebase Config

1. Click **Project Settings** (gear icon, top-left)
2. Go to **"Your apps"** tab
3. Click **"</>Web"** (or click your app if already created)
4. Register app name: `geofranzy-web`
5. Choose: **"Also set up Firebase Hosting for this app"** (optional)
6. Copy the Firebase config object:
   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
     databaseURL: "..."
   };
   ```

### Step 4: Create Service Account

1. Go to **Project Settings** → **"Service accounts"** tab
2. Click **"Generate new private key"**
3. Save the JSON file securely (you'll need it for Cloud Functions)
4. Keep this file in `firebase/functions/` (add to .gitignore)

---

## React Native App Setup

### Step 1: Create React Native Project

```bash
# Clone or navigate to the project
cd geofranzy-rn

# Install dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g expo-cli

# Install Firebase CLI (for later)
npm install -g firebase-tools
```

### Step 2: Verify Installation

```bash
# Test Expo
expo --version

# Test Firebase CLI
firebase --version

# List available commands
npm run
```

### Step 3: Create Environment File

```bash
# Copy example env
cp .env.example .env
```

Edit `.env` with your values:

```env
# From Firebase console
EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=geofranzy.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=geofranzy
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=geofranzy.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://geofranzy.firebaseio.com

# From OpenWeatherMap (free tier)
EXPO_PUBLIC_OPENWEATHER_API_KEY=YOUR_OPENWEATHER_KEY

# Environment
ENVIRONMENT=development
APP_DEBUG=true

# EAS Build (we'll set this up later)
EAS_PROJECT_ID=YOUR_EAS_PROJECT_ID
```

### Step 4: Get OpenWeatherMap API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up (free tier available)
3. Go to **API keys** section
4. Copy your API key
5. Add to `.env`

---

## Environment Configuration

### Update Firebase Config in App

The Firebase configuration is already in `src/services/firebase.ts`. It reads from `.env` variables.

Verify the file:
```typescript
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // ... etc
};
```

### Set Up Firestore Rules

Create or update `firestore.rules`:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read if authenticated
    match /{document=**} {
      allow read: if request.auth != null;
    }

    // Users: read own, write own
    match /users/{uid} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid == uid || 
                      request.auth.token.firebase.sign_in_provider == 'custom';
    }

    // Locations: read + write if authenticated
    match /locations/{userId} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid == userId || 
                      request.auth.token.firebase.sign_in_provider == 'custom';
    }

    // Friends: authenticated users only
    match /friends/{document=**} {
      allow read: if request.auth.uid != null;
      allow create: if request.auth.uid != null;
      allow delete: if request.auth.uid == resource.data.userId;
    }

    // SOS Alerts: authenticated users
    match /sos_alerts/{document=**} {
      allow read: if request.auth.uid != null;
      allow create: if request.auth.uid != null;
      allow update: if request.auth.uid == resource.data.userId;
    }

    // Meeting History: read authenticated, write cloud functions
    match /meeting_history/{document=**} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.token.firebase.sign_in_provider == 'custom';
    }

    // Weather: read authenticated, write own
    match /weather/{document=**} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid == document;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## Cloud Functions Setup

### Step 1: Set Up Firebase CLI

```bash
firebase login
```

This will open a browser to authenticate with your Google account.

### Step 2: Install Cloud Functions

```bash
cd firebase/functions
npm install
cd ../..
```

### Step 3: Deploy Functions

```bash
npm run build --prefix firebase/functions
firebase deploy --only functions
```

This will:
- Build TypeScript to JavaScript
- Deploy all functions to Firebase
- Show URLs for HTTP-triggered functions

Verify deployment:
```bash
firebase functions:log
```

---

## Running the App

### Option 1: Expo Go (Easiest for Development)

```bash
# Start Expo server
npm run start

# You'll see a QR code
# Android: Scan with Expo Go app
# iOS: Scan with Camera app, then open with Expo Go
```

### Option 2: Android Emulator

**Prerequisites**: Android Studio installed

```bash
npm run android
```

This will:
- Start Android emulator (if not already running)
- Build and install the app
- Start the metro bundler

### Option 3: iOS Simulator (macOS only)

**Prerequisites**: Xcode installed

```bash
npm run ios
```

This will:
- Start iOS simulator
- Build and install the app
- Start the metro bundler

### Testing the App

1. **Sign up**:
   - Enter email, password, display name
   - Should create user in Firebase Auth + Firestore

2. **Grant permissions**:
   - Allow location access
   - Allow notification access

3. **Test location tracking**:
   - Should see your current location
   - Try moving and watch it update

4. **Test with second device**:
   - Sign up with different email on second device
   - Make them friends
   - Move one device <500m away
   - Should receive nearby notification

---

## Testing

### Manual Testing Checklist

- [ ] Sign up creates user account
- [ ] Login with correct email/password works
- [ ] Location updates every 30 seconds
- [ ] Own location shown on map
- [ ] Ghost mode toggle works
- [ ] Friends list can be viewed
- [ ] SOS broadcast sends notification
- [ ] Weather sharing works
- [ ] Meeting history logs correctly
- [ ] Logout clears session

### Test Data

Create test users:
```javascript
// User 1
Email: alice@test.com
Password: Test123!
Name: Alice

// User 2
Email: bob@test.com
Password: Test123!
Name: Bob
```

### Emulator Locations

To test proximity alerts in emulator:

**Android Emulator**:
1. Open Extended Controls (⋮ menu)
2. Go to **Location**
3. Enter latitude/longitude and click **Send**

**iOS Simulator**:
1. Features → Location → Custom Location
2. Enter coordinates

### Performance Testing

Monitor in Chrome DevTools:
```bash
# Run debug console
npm run start
# Press 'd' in terminal, then go to chrome://inspect
```

---

## Deployment

### Phase 1: Internal Testing

1. Build APK for Android:
   ```bash
   eas build --platform android
   ```

2. Build IPA for iOS:
   ```bash
   eas build --platform ios
   ```

3. Test on real devices before submitting to stores

### Phase 2: Google Play Store

```bash
# Create Google Play Developer account ($25)
# Create signed APK
eas build --platform android --release

# Upload to Google Play Console
# Follow store submission guidelines
```

### Phase 3: Apple App Store

```bash
# Create Apple Developer account ($99/year)
# Create signed IPA
eas build --platform ios --release

# Upload to App Store Connect
# Follow review guidelines
```

---

## Troubleshooting

### "Firebase config is not defined"
- Ensure `.env` file exists with all Firebase keys
- Verify `EXPO_PUBLIC_` prefix on env vars
- Restart Expo server: `npm run start`

### "Location permission denied"
- Check device settings → App permissions → Location
- Enable "Allow all the time" for Android 12+
- Restart app after changing permissions

### "Notifications not received"
- Verify FCM token saved in Firestore users collection
- Check Cloud Functions logs: `firebase functions:log`
- Ensure app has notification permission
- Try force-closing and reopening app

### "Firestore write fails"
- Check Firestore rules allow authenticated writes
- Verify user is logged in (check Firebase Auth)
- Check network connectivity
- View errors: `firebase emulators:start --inspect-functions`

### "Cloud Functions not deploying"
- Check Node.js version: `node --version` (needs 18+)
- Build locally: `npm run build --prefix firebase/functions`
- Check for TypeScript errors
- View detailed logs: `firebase deploy --debug`

### "App not updating location"
- Grant location permission: Settings → Geofranzy → Location
- Enable GPS on device
- Check location service interval isn't too long
- Monitor in Cloud Functions log

---

## Next Steps

1. ✅ **Phase 1**: Project setup (COMPLETED)
2. 🟡 **Phase 2**: Cloud Functions refinement (IN PROGRESS)
3. 🟠 **Phase 3**: UI/UX enhancement (NEXT)
4. 🔴 **Phase 4**: Advanced features (PLANNED)
5. 🔴 **Phase 5**: App Store deployment (PLANNED)

## Getting Help

- Check [Expo documentation](https://docs.expo.dev)
- Check [Firebase documentation](https://firebase.google.com/docs)
- View Cloud Functions logs: `firebase functions:log`
- Open GitHub issues for bugs

---

**Last Updated**: February 21, 2026
**Status**: Phase 1 Complete ✅

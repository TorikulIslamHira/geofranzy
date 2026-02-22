# Geofranzy - React Native + Web + Firebase

A real-time friend location sharing and emergency alert application built with **React Native (Mobile)**, **React (Web)**, and **Firebase (Backend)**.

## 🌟 Platforms

- 📱 **Mobile App**: React Native + Expo (iOS & Android)
- 🌐 **Web App**: React + TypeScript + Vite
- ☁️ **Backend**: Firebase (Cloud Functions, Firestore, Authentication)

## Features

- **Live Location Tracking**: Share real-time location with friends
- **Proximity Alerts**: Get notified when friends are nearby (500m threshold)
- **Emergency SOS**: Broadcast emergency alerts to all friends instantly
- **Weather Sharing**: Share current weather conditions with friends
- **Meeting History**: Auto-logged meetings when spending time together
- **Ghost Mode**: Hide your location from friends when needed
- **Push Notifications**: Real-time notifications via Firebase Cloud Messaging
- **Cross-Platform**: Works on iOS, Android, and Web browsers

## 🚀 Quick Start

### Mobile App
```bash
npm install
cp .env.example .env
npm start
```

### Web App
```bash  
cd web
npm install
cp .env.example .env
npm run dev
```

### Deploy Backend
```bash
firebase deploy
```

📚 **[Complete Setup Guide](docs/SETUP.md)** • 🌐 **[Web App Docs](web/README.md)** • 🔥 **[Phase 2 Completion](PHASE2_COMPLETION.md)**

## Tech Stack

### Mobile App
- **Frontend**: React Native + Expo (iOS & Android)
- **Navigation**: React Navigation
- **Location**: Expo Location API
- **Maps**: React-native-maps (Google Maps/Apple Maps)
- **Notifications**: Expo Notifications + Firebase Cloud Messaging

### Web App
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Maps**: Leaflet + React-Leaflet
- **State Management**: Zustand
- **Routing**: React Router v6

### web/                     # 🌐 WEB APPLICATION
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/    # Layout & UI components
│   │   ├── pages/         # 6 page components
│   │   ├── services/      # Firebase & Firestore
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # Zustand state management
│   │   ├── utils/         # Helper functions
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app component
│   │   ├── main.tsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── index.html         # HTML template
│   ├── package.json       # Web dependencies
│   ├── vite.config.ts     # Vite configuration
│   ├── tsconfig.json      # TypeScript config
│   ├── tailwind.config.js # Tailwind CSS config
│   ├── .env.example       # Environment template
│   └── README.md          # Web app docs
├── src/                      # 📱 MOBILE APP SOURCE CODE
│   ├── screens/             # App screens
│   │   ├── auth/           # Login, Signup
│   │   ├── main/           # Map, SOS, Weather, History, Profile
│   │   └── index.ts        # Screen exports
│   ├── components/          # Reusable UI components
│   ├── services/            # Firebase, location, notifications
│   │   ├── firebase.ts     # Firebase initialization
│   │   ├── firestoreService.ts
│   │   ├── locationService.ts
│   │   ├── notificationService.ts
│   │   └── index.ts        # Service exports
│   ├── context/             # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── LocationContext.tsx
│   │   └── index.ts        # Context exports
│   ├── navigation/          # Navigation structure
│   │   ├── RootNavigator.tsx
│   │   └── index.ts        # Navigation exports
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts        # Common types
│   ├── utils/               # Utility functions
│   │   ├── distance.ts     # Distance calculations
│   │   └── index.ts        # Utils exports
│   ├── hooks/               # Custom React hooks
│   ├── theme/               # Design system
│   │   ├── theme.ts        # Colors, typography, spacing
│   │   └── index.ts        # Theme exports
│   └── index.ts             # Main source exports
├── firebase/                 # ☁️ FIREBASE CLOUD FUNCTIONS
│   ├── functions/
│   │   └── src/
│   │       └── index.ts    # 9 Cloud Functions
│   └── README.md
├── mcp-servers/             # MCP (Model Context Protocol) servers
│   ├── firebase-server.ts
│   ├── firebase-server.js
│   ├── start-firebase.ps1
│   ├── start-firebase.sh
│   └── README.md
├── scripts/                 # Automation scripts
│   ├── deploy.ps1          # Windows deployment
│   ├── deploy.sh           # Unix deployment
│   ├── setup-scheduler.ps1 # Windows scheduler setup
│   ├── setup-scheduler.sh  # Unix scheduler setup
│   └── README.md
├── docs/                    # 📚 DOCUMENTATION
│   ├── SETUP.md            # Setup instructions
│   ├── QUICK_START.md      # Quick start guide
│   ├── MCP_*.md            # MCP documentation
│   ├── PHASE2_*.md         # Phase 2 documentation
│   └── README.md           # Docs index
├── assets/                  # Images, icons, fonts
├── app.json                 # Expo configuration
├── App.tsx                  # Root component (Mobile)
├── package.json             # Mobile dependencies
├── tsconfig.json            # TypeScript config (with path aliases)
├── babel.config.js          # Babel config (module resolver)
├── eas.json                 # EAS build config
├── firebase.json            # Firebase config
├── firestore.rules          # Firestore security rules
├── storage.rules            # Storage security rules
├── PHASE2_COMPLETION.md     # Phase 2 completion report
│   └── README.md           # Docs index
├── assets/                  # Images, icons, fonts
├── app.json                 # Expo configuration
├── App.tsx                  # Root component
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config (with path aliases)
├── babel.config.js          # Babel config (module resolver)
├── eas.json                 # EAS build config
├── firebase.json            # Firebase config
├── firestore.rules          # Firestore security rules
├── storage.rules            # Storage security rules
└── README.md                # This file

```

### Path Aliases

The project uses TypeScript path aliases for cleaner imports:

- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@context/*` → `src/context/*`
- `@hooks/*` → `src/hooks/*`
- `@navigation/*` → `src/navigation/*`
- `@screens/*` → `src/screens/*`
- `@services/*` → `src/services/*`
- `@theme/*` → `src/theme/*`
- `@utils/*` → `src/utils/*`
- `@types/*` → `src/types/*`

**Example**:
```typescript
// Instead of: import { useAuth } from '../../context/AuthContext';
import { useAuth } from '@context';

// Instead of: import { Colors, Spacing } from '../../theme/theme';
import { Colors, Spacing } from '@theme';
```

```

## Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- Firebase account
- For iOS: Xcode (macOS only)
- For Android: Android Studio or Android SDK

### 1. Clone & Install Dependencies

```bash
cd geofranzy-rn
npm install
```

### 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project called "geofranzy"
3. Enable these services:
   - **Authentication** (Email/Password method)
   - **Firestore Database** (Start in test mode)
   - **Cloud Storage** (for profile photos)
   - **Cloud Messaging** (for push notifications)
   - **Cloud Functions** (to be deployed)

4. Download your Firebase config:
   - Go to **Project Settings** > Copy the web SDK config
   - Create a `.env` file in the root and add:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
```

### 3. Run the App

**Development (Expo Go)**:
```bash
npm run start
```

Then scan the QR code with Expo Go app (iOS/Android)

**Android Emulator**:
```bash
npm run android
```

**iOS Simulator** (macOS only):
```bash
npm run ios
```

### 4. Run the Web App

```bash
cd web
npm install
cp .env.example .env
# Edit web/.env with your Firebase credentials
npm run dev
```

The web app will open at `http://localhost:3000`

### 5. Deploy Firebase Backend (Phase 2)

```bash
# Windows
.\scripts\deploy.ps1

# macOS/Linux
./scripts/deploy.sh
```

This deploys:
- Cloud Functions (9 functions)
- Firestore security rules
- Firestore indexes
- Storage rules

## Development Phases

### ✅ Phase 1: Project Setup & Structure (COMPLETED)
- React Native + Expo project initialized
- Firebase services configured
- Core authentication system with contexts
- All 5 main screens scaffolded
- Location tracking service set up
- Notification service created
- Firestore database service created

### 🟡 Phase 2: Firebase Cloud Functions (IN PROGRESS)
- Proximity alert Cloud Function
- SOS broadcast Cloud Function
- Meeting history auto-logging
- Push notification triggers
- Friend management functions

### 🟠 Phase 3: Full UI/UX Implementation (NEXT)
- Login/Signup screens polish
- Map screen with real-time markers
- Advanced SOS screen animations
- Weather integration with OpenWeatherMap
- Meeting history improvements

### 🔴 Phase 4: Advanced Features (PLANNED)
- On My Way / ETA sharing
- Meeting Point Finder
- Offline mode with local caching
- Enhanced ghost mode features

### 🔴 Phase 5: Testing & Deployment (PLANNED)
- End-to-end testing
- Performance optimization
- Google Play Store submission
- Apple App Store submission

## Core Services

### AuthContext (`src/context/AuthContext.tsx`)
Manages user authentication with Firebase Auth. Provides:
- `signUp(email, password, displayName)`
- `signIn(email, password)`
- `logOut()`
- `updateProfile(updates)`

**Usage**:
```tsx
const { user, userProfile, signIn, logOut } = useAuth();
```

### LocationContext (`src/context/LocationContext.tsx`)
Manages user location and friends' locations. Provides:
- `currentLocation` - User's current coordinates
- `friendsLocations` - All friends' current locations with distances
- `refreshFriendsLocations()` - Manual refresh trigger

**Usage**:
```tsx
const { currentLocation, friendsLocations } = useLocation();
```

### locationService (`src/services/locationService.ts`)
Handles GPS tracking and updates:
- `requestLocationPermission()`
- `startLocationTracking(userId, callback)`
- `stopLocationTracking()`
- `getCurrentLocation()`
- `updateLocationOnce(userId)`

### firestoreService (`src/services/firestoreService.ts`)
Firestore database operations:
- Friends: `sendFriendRequest()`, `acceptFriendRequest()`, `getFriendsList()`, `removeFriend()`
- SOS: `broadcastSOS()`, `resolveSOSAlert()`, `getActiveSOSAlerts()`
- Weather: `shareWeather()`, `getFriendsWeather()`
- History: `logMeeting()`, `getMeetingHistory()`
- Ghost Mode: `toggleGhostMode()`

### notificationService (`src/services/notificationService.ts`)
Push notification management:
- `initializeNotifications(userId)`
- `sendLocalNotification(data)`
- `sendNearbyNotification(friendName, distance)`
- `sendSOSNotification(friendName)`
- `setupNotificationListeners()`

## Firestore Database Schema

### Users Collection
```json
{
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "photoURL": "string (optional)",
  "ghostMode": "boolean",
  "createdAt": "timestamp",
  "fcmToken": "string (optional)",
  "lastLocation": "GeoPoint",
  "lastLocationUpdate": "number (timestamp)",
  "expoPushToken": "string (optional)"
}
```

### Locations Collection
```json
{
  "userId": "string",
  "coordinates": "GeoPoint",
  "accuracy": "number",
  "altitude": "number",
  "speed": "number",
  "heading": "number",
  "timestamp": "number",
  "lastUpdate": "timestamp"
}
```

### Friends Collection
```json
{
  "userId": "string",
  "friendId": "string",
  "status": "pending | accepted | rejected",
  "addedAt": "number"
}
```

### SOS Alerts Collection
```json
{
  "userId": "string",
  "userName": "string",
  "message": "string",
  "location": "GeoPoint",
  "timestamp": "number",
  "status": "active | resolved",
  "recipients": "string[]"
}
```

### Meeting History Collection
```json
{
  "user1Id": "string",
  "user1Name": "string",
  "user2Id": "string",
  "user2Name": "string",
  "meetingTime": "number",
  "meetingEndTime": "number",
  "duration": "number (ms)",
  "location": "GeoPoint"
}
```

### Weather Collection
```json
{
  "userId": "string",
  "userName": "string",
  "temp": "number",
  "condition": "string",
  "humidity": "number",
  "windSpeed": "number",
  "timestamp": "number",
  "sharedWith": "string[]"
}
```

## API Reference

For detailed documentation:
- **Cloud Functions API**: [firebase/README.md](./firebase/README.md)
- **Setup Guide**: [docs/SETUP.md](./docs/SETUP.md)
- **Quick Start**: [docs/QUICK_START.md](./docs/QUICK_START.md)
- **MCP Integration**: [docs/MCP_README.md](./docs/MCP_README.md)

## Permissions Required

**Android** (in `app.json`):
- `ACCESS_FINE_LOCATION` - GPS tracking
- `ACCESS_COARSE_LOCATION` - Network location
- `POST_NOTIFICATIONS` - Push notifications

**iOS** (in `app.json`):
- Location: Always & When In Use
- Background modes: Location, Processing

## Troubleshooting

### Location not updating
- Check location permissions in device settings
- Ensure device GPS is enabled
- Check battery optimization settings

### Notifications not received
- Verify FCM token is stored in Firestore
- Check notification permissions
- Disable battery optimization for the app

### Firebase connection issues
- Verify Firebase config in `.env`
- Check Firestore rules allow read/write
- Ensure Firebase project is active

## Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase and API keys:

```bash
cp .env.example .env
```

Then update with your actual values from Firebase Console and OpenWeatherMap API.

## Building for Production

### Android Build
```bash
npm run build:android
```

### iOS Build
```bash
npm run build:ios
```

This uses **EAS Build** (Expo's build service). You'll need:
1. Expo account
2. Apple Developer account (for iOS)
3. Google Play Developer account (for Android)

## Testing

### Running Tests

**Mobile App (Jest)**:
```bash
npm test                 # Run all tests
npm test -- --watch      # Watch mode
npm test -- --coverage   # With coverage report
```

**Web App (Vitest)**:
```bash
cd web
npm test                # Watch mode
npm run test:ui         # UI mode
npm run test:coverage   # Coverage report
```

### Test Structure

```
src/tests/              # Mobile app tests
├── setup.ts           # Jest setup & mocks
├── utils/             # Utility function tests
│   └── distance.test.ts
├── services/          # Service tests (planned)
└── screens/           # Screen tests (planned)

web/src/tests/         # Web app tests
├── setup.ts           # Vitest setup & mocks
├── mocks/
│   ├── firebase.ts    # Firebase SDK mocks
│   └── mockData.ts    # Test data
├── utils/             # Utility tests
│   └── location.test.ts
├── store/             # Store tests
│   └── index.test.ts
└── components/        # Component tests
    └── Layout.test.tsx
```

### Coverage Goals
- **Mobile**: 70%+ (statements, branches, functions, lines)
- **Web**: 80%+ (statements, branches, functions, lines)

### Testing Documentation
- **[Complete Testing Guide](docs/TESTING.md)** - Setup, best practices, examples
- **[Phase 3 Guide](docs/PHASE3_GUIDE.md)** - Testing strategy & roadmap
- **[Phase 3 Status](docs/PHASE3_STATUS.md)** - Current testing progress

### Current Test Status
- ✅ Testing infrastructure setup (Jest + Vitest)
- ✅ Utils tests: Distance calculations (9 tests passing)
- ✅ Store tests: Zustand state management
- ✅ Component tests: Layout component
- ⏳ Service tests: In progress
- ⏳ Integration tests: Planned
- ⏳ E2E tests: Planned

## Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly on both platforms
4. Submit pull request

## License

MIT - See LICENSE file

## Support

For issues, feature requests, or questions, please open an issue on GitHub.

---

**Status**: � Active Development (Phase 3 - Testing)  
**Last Updated**: February 22, 2026  
**Team**: Geofranzy Development Team

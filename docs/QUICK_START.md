# Geofranzy - Developer Quick Start

Get up and running in 10 minutes. Detailed guide at [SETUP.md](./SETUP.md).

## Prerequisites (5 min)

```bash
# Install Node.js 18+ from https://nodejs.org
node --version      # v18+

# Install dependencies
npm install -g expo-cli
npm install -g firebase-tools
```

## Setup (5 min)

### 1. Configure Firebase

```bash
# Get Firebase config from console.firebase.google.com
# Create geofranzy project, enable Auth + Firestore + Cloud Messaging

# Create .env file
cp .env.example .env

# Edit .env with your Firebase config
# Use values from Firebase Project Settings
```

### 2. Install App Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run start
```

Scan QR code with:
- **Android**: Expo Go app → scan
- **iOS**: Camera app → open with Expo Go

## File Structure Reference

```
geofranzy-rn/
├── src/
│   ├── screens/          ← UI screens (edit here!)
│   ├── services/         ← Firebase & location logic
│   ├── context/          ← Global state (auth, location)
│   ├── theme/            ← Colors, fonts, spacing
│   └── utils/            ← Helpers (distance calc)
├── firebase/functions/   ← Cloud Functions (serverless backend)
├── App.tsx               ← Root component
└── app.json              ← Expo config
```

## Common Tasks

### Add a new screen

```typescript
// Create file: src/screens/myscreen/MyScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Spacing } from '../../theme/theme';

const MyScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text>My Screen</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
});

export default MyScreen;
```

Then add to navigation in `src/navigation/RootNavigator.tsx`.

### Use authentication

```typescript
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, userProfile, signIn, logOut } = useAuth();
  
  // Use here...
};
```

### Update user location

```typescript
import { updateLocationOnce, startLocationTracking } from '../services/locationService';
import { useAuth } from '../context/AuthContext';

const { user } = useAuth();
if (user) {
  await startLocationTracking(user.uid);
}
```

### Send notification

```typescript
import { sendNearbyNotification } from '../services/notificationService';

await sendNearbyNotification('John Doe', 250); // "John Doe is nearby (250m away)"
```

### Firestore operations

```typescript
import { getFriendsList, broadcastSOS, logMeeting } from '../services/firestoreService';

// Get friends
const friends = await getFriendsList(userId);

// Send SOS
await broadcastSOS(userId, userName, latitude, longitude);

// Log meeting
await logMeeting(user1Id, user1Name, user2Id, user2Name, lat, lon, duration);
```

## Debug

### View Console Logs

```bash
npm run start
# Press 'j' in terminal to open debugger
```

### Firebase Functions Logs

```bash
firebase functions:log
```

### Firestore Data

Visit [Firebase Console](https://console.firebase.google.com) → Firestore → Collections

### Expo Go Error Messages

```bash
npm run start
# Error messages appear in terminal + Expo Go app
```

## Hot Reload

Changes auto-reload! If not:
```bash
# Full reload
npm run start
# Press 'r' in terminal
```

## Build for Device

### Android APK (for testing)

```bash
eas build --platform android --profile preview
```

### iOS Test Flight (needs Apple Developer account)

```bash
eas build --platform ios --profile preview
```

## Environment Variables

All `EXPO_PUBLIC_*` variables in `.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_key
```

Access in code:
```typescript
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
```

## Useful Commands

```bash
# Development
npm run start           # Start Expo server
npm run android         # Run on Android emulator
npm run ios             # Run on iOS simulator

# Building
npm run build:android   # Build for Google Play
npm run build:ios       # Build for App Store

# Firebase
firebase login          # Login to Firebase
firebase deploy          # Deploy functions + rules
firebase emulators:start # Start local emulator

# Utilities
npm install [package]   # Add dependency
npm run test            # Run tests (when configured)
```

## Code Style

### Use TypeScript

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
}

const user: User = { id: '123', email: 'test@example.com' };

// ❌ Avoid
const user = { id: '123', email: 'test@example.com' };
```

### Use Functional Components

```typescript
// ✅ Good
const MyScreen = () => {
  return <Text>Hello</Text>;
};

// ❌ Avoid
class MyScreen extends React.Component {
  render() { return <Text>Hello</Text>; }
}
```

### Use Hooks

```typescript
// ✅ Good
const MyComponent = () => {
  const [count, setCount] = useState(0);
  const { user } = useAuth();
  
  useEffect(() => {
    // Effect
  }, []);
};

// ❌ Avoid (class components)
```

### Theme Colors

```typescript
import { Colors } from '../theme/theme';

// ✅ Good
backgroundColor: Colors.dark.primary,
color: Colors.dark.text,

// ❌ Avoid
backgroundColor: '#FF6B6B',
color: '#FFFFFF',
```

## Troubleshooting

### App won't start

```bash
npm install
npm run start
# Clear cache: Press 'c'
```

### Firebase errors

```bash
# Verify config
echo $EXPO_PUBLIC_FIREBASE_API_KEY

# Check Firestore rules at: https://console.firebase.google.com
# Rules tab → Firestore Database
```

### Location not working

Go to device **Settings** → **Geofranzy** → **Location** → Enable "Allow all the time"

### No notifications

1. Grant notification permission on device
2. Check FCM token in Firestore: Console → users → [userId] → expoPushToken
3. Check Cloud Functions logs: `firebase functions:log`

## Next Steps

1. ✅ Start dev server (`npm run start`)
2. ✅ Test on emulator/device
3. 🔜 Implement UI/UX (Phases 3)
4. 🔜 Add features (Phase 4)
5. 🔜 Deploy to App Stores (Phase 5)

## Documentation

- **Full setup**: [SETUP.md](./SETUP.md)
- **Architecture**: [README.md](./README.md)
- **Migration details**: [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)
- **Cloud Functions**: [firebase/README.md](./firebase/README.md)

## Get Help

- Check [Expo docs](https://docs.expo.dev)
- Check [Firebase docs](https://firebase.google.com/docs)
- View error in terminal output
- Check Firebase Console for data

---

**You're ready!** Start with `npm run start` 🚀

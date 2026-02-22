# Geofranzy Firebase Cloud Functions

Backend serverless functions that handle:
- Real-time location updates and proximity detection
- SOS alert broadcasting
- Meeting history auto-logging
- Push notifications via Firebase Cloud Messaging
- User profile initialization and cleanup
- Friend request management
- Weather sharing notifications

## Functions Overview

### Location Functions

#### `handleLocationUpdate` (Firestore trigger)
Triggered when user location document is updated.
- Calculates distance to all friends
- Sends proximity alerts when <500m and not in ghost mode
- Notifies both users in real-time

**Trigger**: `locations/{locationId}` document written

**Data flow**:
```
User updates GPS location
    ↓
Firestore: locations/{userId}
    ↓
Cloud Function: handleLocationUpdate
    ↓
Calculate distance to all friends
    ↓
If distance < 500m → Send FCM notification
```

### SOS Functions

#### `broadcastSOSAlert` (Firestore trigger)
Triggered when SOS alert is created.
- Gets user's friends list
- Broadcasts notification to all friends with location data
- Stores friends list for later reference

**Trigger**: `sos_alerts/{sosId}` document created

**Data flow**:
```
User broadcasts SOS
    ↓
Firestore: sos_alerts/{sosId} created
    ↓
Cloud Function: broadcastSOSAlert
    ↓
Get friends list
    ↓
Send FCM notification to all friends with location
```

#### `resolveSOSAlert` (Firestore trigger)
Triggered when SOS alert status changes to resolved.
- Notifies all recipients that alert is resolved
- Clears active alert state

**Trigger**: `sos_alerts/{sosId}` document updated (status changed)

### Friends Functions

#### `notifyFriendRequest` (Firestore trigger)
Triggered when friend request is created.
- Sends notification to recipient
- Includes requester's name

**Trigger**: `friends/{friendId}` document created

#### `notifyFriendRequestAccepted` (Firestore trigger)
Triggered when friend request status changes to accepted.
- Notifies requester of acceptance
- Enables location sharing

**Trigger**: `friends/{friendId}` document updated (status → accepted)

### Meeting History Functions

#### `autoLogMeetings` (Pub/Sub scheduled)
Runs every 5 minutes via Cloud Scheduler.
- Checks all location pairs
- Auto-logs meetings when users are <50m for >5 minutes
- Creates meeting history records

**Trigger**: Cloud Scheduler (every 5 minutes)

**Conditions**:
- Distance ≤ 50 meters
- Duration ≥ 5 minutes
- Both users have location data

### User Functions

#### `initializeUserProfile` (Auth trigger)
Triggered when new user is created.
- Creates user document in Firestore
- Initializes default settings (ghost mode = false, notifications = true)
- Sets creation timestamp

**Trigger**: Firebase Auth user created

#### `cleanupUserData` (Auth trigger)
Triggered when user account is deleted.
- Removes user document
- Deletes location history
- Removes all friend relationships
- Cleans up related data

**Trigger**: Firebase Auth user deleted

### Weather Functions

#### `notifyWeatherShare` (Firestore trigger)
Triggered when weather is shared.
- Sends notification to all friends user shared weather with
- Includes weather condition

**Trigger**: `weather/{userId}` document written

## Deployment

### Prerequisites

```bash
npm install -g firebase-tools
firebase login
firebase init
```

### Build Functions

```bash
npm run build
```

### Deploy to Firebase

```bash
npm run deploy
```

### View Logs

```bash
npm run logs
```

### Local Development

```bash
npm run serve
```

This starts the Firebase emulator with local functions for testing.

## Function Details

### Location Update Flow

```typescript
// User sends location from React Native app
POST /api/location/update
{
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10
}

// Cloud Function automatically:
// 1. Receives location update via Firestore listener
// 2. Queries all accepted friends
// 3. Gets their latest locations
// 4. Calculates distance using Haversine formula
// 5. If distance < 500m → sends FCM notification
// 6. Stores location in Firestore for history
```

### SOS Broadcast Flow

```typescript
// User sends SOS
broadcastSOS({
  userId: "user123",
  message: "I need help!",
  location: { latitude, longitude }
})

// Cloud Function automatically:
// 1. Triggered by new sos_alerts document
// 2. Gets user's friend list (status='accepted')
// 3. Sends FCM notification to each friend:
//    {
//      title: "🆘 Emergency SOS Alert!",
//      body: "John Doe sent an emergency SOS alert",
//      data: {
//        type: "sos",
//        userId: "user123",
//        latitude: "40.7128",
//        longitude: "-74.0060"
//      }
//    }
// 4. Updates sos_alerts with recipients list
// 5. Stores notification timestamp
```

### Meeting Auto-Logging Flow

```typescript
// Runs every 5 minutes via Cloud Scheduler
// 1. Fetch all location documents
// 2. Compare all user pairs
// 3. If distance < 50m:
//    - Calculate time together
//    - If duration > 5 minutes → log meeting
// 4. Create meeting_history document:
//    {
//      user1Id, user1Name,
//      user2Id, user2Name,
//      meetingTime,
//      duration,
//      location
//    }
```

## Error Handling

All functions include try-catch blocks that:
- Log errors to Cloud Logging (visible via `firebase functions:log`)
- Continue execution if individual notifications fail
- Store failed notifications for retry (future implementation)

## Performance Considerations

- **Location queries**: Indexed on `userId` and `status`
- **Batch operations**: Used for bulk friend deletions
- **Concurrent notifications**: Promise.all for parallel sends
- **Memory**: Functions optimized for <128MB usage

## Firestore Rules

Ensure your Firestore security rules allow Cloud Functions to read/write:

```firebase_rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Locations
    match /locations/{document=**} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid == resource.data.userId || 
                      request.auth.token.firebase.sign_in_provider == 'custom';
    }

    // Users
    match /users/{uid} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid == uid || 
                      request.auth.token.firebase.sign_in_provider == 'custom';
    }

    // SOS Alerts
    match /sos_alerts/{document=**} {
      allow read: if request.auth.uid != null;
      allow create: if request.auth.uid != null;
      allow update: if request.auth.uid == resource.data.userId;
    }

    // Friends
    match /friends/{document=**} {
      allow read: if request.auth.uid != null;
      allow create: if request.auth.uid != null;
      allow delete: if request.auth.uid == resource.data.userId;
    }

    // Meetings
    match /meeting_history/{document=**} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.token.firebase.sign_in_provider == 'custom';
    }

    // Weather
    match /weather/{document=**} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid == document;
    }
  }
}
```

## Troubleshooting

### Notifications not being received
- Verify FCM/Expo token stored in user document
- Check Cloud Function logs: `firebase functions:log`
- Ensure notification permissions granted on device

### Meeting not auto-logging
- Verify users are <50m apart
- Check distance calculation is correct
- Confirm Cloud Scheduler job is running (View in Google Cloud Console)

### Location updates slow
- Check Firestore indexes on `locations` collection
- Verify network connectivity
- Consider increasing `updateLocation` interval in app

## Monitoring

View function performance in Google Cloud Console:
- Functions tab → Select function → Monitoring
- Logs: Cloud Logging or via `firebase functions:log`
- Metrics: Execution time, memory usage, errors

## Future Enhancements

- [ ] Retry logic for failed notifications
- [ ] Analytics for meeting patterns
- [ ] Proximity zones (50m, 100m, 500m alerts)
- [ ] Scheduled location cleanup (older than 30 days)
- [ ] Integration with Google Maps for route suggestions

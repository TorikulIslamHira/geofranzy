import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate distance between two geopoints using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Send notification to user via FCM
 */
async function sendNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return;

    const user = userDoc.data();
    const token = user?.expoPushToken || user?.fcmToken;

    if (!token) {
      console.log(`No push token for user ${userId}`);
      return;
    }

    await messaging.send({
      token,
      notification: { title, body },
      data: data || {},
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
    });

    console.log(`Notification sent to ${userId}`);
  } catch (error) {
    console.error(`Error sending notification to ${userId}:`, error);
  }
}

// ==================== LOCATION FUNCTIONS ====================

/**
 * Triggered when user updates location
 * - Check for nearby friends
 * - Log meetings if users are close for long enough
 */
export const handleLocationUpdate = functions.firestore
  .document('locations/{locationId}')
  .onWrite(async (change, context) => {
    const { locationId } = context.params;
    const after = change.after.data();

    if (!after) return; // Document deleted

    const { userId, coordinates } = after;
    const userCoords = coordinates as admin.firestore.GeoPoint;

    try {
      // Get user's friends list
      const friendsSnapshot = await db
        .collection('friends')
        .where('userId', '==', userId)
        .where('status', '==', 'accepted')
        .get();

      const friendIds = friendsSnapshot.docs.map((doc) => doc.data().friendId);

      if (friendIds.length === 0) return;

      // Check proximity to each friend
      for (const friendId of friendIds) {
        const friendLocSnapshot = await db.collection('locations').doc(friendId).get();
        if (!friendLocSnapshot.exists) continue;

        const friendLocData = friendLocSnapshot.data();
        const friendCoords = friendLocData?.coordinates as admin.firestore.GeoPoint;

        const distance = calculateDistance(
          userCoords.latitude,
          userCoords.longitude,
          friendCoords.latitude,
          friendCoords.longitude
        );

        const PROXIMITY_THRESHOLD = 500; // meters

        if (distance <= PROXIMITY_THRESHOLD) {
          // Send nearby alert to both users
          const userDoc = await db.collection('users').doc(userId).get();
          const friendDoc = await db.collection('users').doc(friendId).get();

          const userName = userDoc.data()?.displayName || 'Friend';
          const friendName = friendDoc.data()?.displayName || 'Friend';

          // Check if both users are not in ghost mode
          const userGhost = userDoc.data()?.ghostMode || false;
          const friendGhost = friendDoc.data()?.ghostMode || false;

          if (!userGhost) {
            await sendNotification(
              friendId,
              '📍 Nearby Alert!',
              `${userName} is nearby (${Math.round(distance)}m away)`,
              { type: 'nearby', userId, distance: distance.toString() }
            );
          }

          if (!friendGhost) {
            await sendNotification(
              userId,
              '📍 Nearby Alert!',
              `${friendName} is nearby (${Math.round(distance)}m away)`,
              { type: 'nearby', userId: friendId, distance: distance.toString() }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  });

// ==================== SOS FUNCTIONS ====================

/**
 * Broadcast SOS to all friends
 */
export const broadcastSOSAlert = functions.firestore
  .document('sos_alerts/{sosId}')
  .onCreate(async (snap, context) => {
    const { sosId } = context.params;
    const sosData = snap.data();

    const { userId, userName, message, location } = sosData;

    try {
      // Get user's friends
      const friendsSnapshot = await db
        .collection('friends')
        .where('userId', '==', userId)
        .where('status', '==', 'accepted')
        .get();

      const friendIds = friendsSnapshot.docs.map((doc) => doc.data().friendId);

      if (friendIds.length === 0) {
        console.log('No friends to notify');
        return;
      }

      // Send SOS notification to all friends
      const notificationPromises = friendIds.map((friendId) =>
        sendNotification(
          friendId,
          '🆘 Emergency SOS Alert!',
          `${userName} sent an emergency SOS alert`,
          {
            type: 'sos',
            sosId,
            userId,
            latitude: location.latitude.toString(),
            longitude: location.longitude.toString(),
          }
        )
      );

      await Promise.all(notificationPromises);

      // Update SOS alert with recipients
      await db.collection('sos_alerts').doc(sosId).update({
        recipients: friendIds,
        notified_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`SOS alert sent to ${friendIds.length} friends`);
    } catch (error) {
      console.error('Error broadcasting SOS:', error);
    }
  });

/**
 * Resolve SOS alert - notify friends that it's resolved
 */
export const resolveSOSAlert = functions.firestore
  .document('sos_alerts/{sosId}')
  .onUpdate(async (change, context) => {
    const { sosId } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger if status changed to 'resolved'
    if (before.status === 'resolved' || after.status !== 'resolved') return;

    const { userName, recipients } = after;

    try {
      // Notify all friends that SOS is resolved
      const notificationPromises = (recipients || []).map((friendId: string) =>
        sendNotification(
          friendId,
          '✅ SOS Resolved',
          `${userName}'s SOS alert has been resolved`,
          { type: 'sos_resolved', sosId }
        )
      );

      await Promise.all(notificationPromises);
      console.log(`SOS resolution notified to ${(recipients || []).length} friends`);
    } catch (error) {
      console.error('Error resolving SOS:', error);
    }
  });

// ==================== FRIENDS FUNCTIONS ====================

/**
 * Notify user of friend request
 */
export const notifyFriendRequest = functions.firestore
  .document('friends/{friendRequestId}')
  .onCreate(async (snap) => {
    const friendData = snap.data();
    const { userId, friendId } = friendData;

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const userName = userDoc.data()?.displayName || 'Someone';

      await sendNotification(
        friendId,
        '👋 Friend Request',
        `${userName} sent you a friend request`,
        { type: 'friend_request', userId }
      );

      console.log(`Friend request notification sent to ${friendId}`);
    } catch (error) {
      console.error('Error notifying friend request:', error);
    }
  });

/**
 * Notify user of friend request acceptance
 */
export const notifyFriendRequestAccepted = functions.firestore
  .document('friends/{friendRequestId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger if status changed to 'accepted'
    if (before.status === 'accepted' || after.status !== 'accepted') return;

    const { userId, friendId } = after;

    try {
      const friendDoc = await db.collection('users').doc(friendId).get();
      const friendName = friendDoc.data()?.displayName || 'Someone';

      await sendNotification(
        userId,
        '✅ Friend Request Accepted',
        `${friendName} accepted your friend request`,
        { type: 'friend_accepted', friendId }
      );

      console.log(`Friend acceptance notification sent to ${userId}`);
    } catch (error) {
      console.error('Error notifying friend acceptance:', error);
    }
  });

// ==================== MEETING HISTORY FUNCTIONS ====================

/**
 * Auto-log meetings when two users are <50m for >5 minutes
 * Note: This would typically be called from a scheduled Cloud Function
 * or triggered by a specific endpoint
 */
export const autoLogMeetings = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    try {
      const locationsSnapshot = await db.collection('locations').get();
      const locations = new Map();

      locationsSnapshot.forEach((doc) => {
        locations.set(doc.id, doc.data());
      });

      // Check all pairs of users
      const userIds = Array.from(locations.keys());
      const MEETING_DISTANCE = 50; // meters
      const MEETING_DURATION = 5 * 60 * 1000; // 5 minutes

      for (let i = 0; i < userIds.length; i++) {
        for (let j = i + 1; j < userIds.length; j++) {
          const user1Id = userIds[i];
          const user2Id = userIds[j];
          const loc1 = locations.get(user1Id);
          const loc2 = locations.get(user2Id);

          if (!loc1 || !loc2) continue;

          const distance = calculateDistance(
            loc1.coordinates.latitude,
            loc1.coordinates.longitude,
            loc2.coordinates.latitude,
            loc2.coordinates.longitude
          );

          if (distance <= MEETING_DISTANCE) {
            // Check if they've been together for 5+ minutes
            const timeTogether = Math.abs(loc1.timestamp - loc2.timestamp);

            if (timeTogether >= MEETING_DURATION) {
              // Log the meeting
              const user1Doc = await db.collection('users').doc(user1Id).get();
              const user2Doc = await db.collection('users').doc(user2Id).get();

              if (user1Doc.exists && user2Doc.exists) {
                await db.collection('meeting_history').add({
                  user1Id,
                  user1Name: user1Doc.data()?.displayName || 'User',
                  user2Id,
                  user2Name: user2Doc.data()?.displayName || 'User',
                  meetingTime: Math.min(loc1.timestamp, loc2.timestamp),
                  duration: timeTogether,
                  location: loc1.coordinates,
                  autoLogged: true,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                console.log(`Meeting logged between ${user1Id} and ${user2Id}`);
              }
            }
          }
        }
      }

      console.log('Auto-meeting logging completed');
    } catch (error) {
      console.error('Error auto-logging meetings:', error);
    }
  });

// ==================== USER FUNCTIONS ====================

/**
 * Initialize user profile when new user is created
 */
export const initializeUserProfile = functions.auth.user().onCreate(async (user) => {
  try {
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'User',
      photoURL: user.photoURL || null,
      ghostMode: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      notificationsEnabled: true,
    });

    console.log(`User profile initialized for ${user.uid}`);
  } catch (error) {
    console.error('Error initializing user profile:', error);
  }
});

/**
 * Clean up user data when account is deleted
 */
export const cleanupUserData = functions.auth.user().onDelete(async (user) => {
  try {
    // Delete user document
    await db.collection('users').doc(user.uid).delete();

    // Delete locations
    const locSnapshot = await db.collection('locations').doc(user.uid).get();
    if (locSnapshot.exists) {
      await db.collection('locations').doc(user.uid).delete();
    }

    // Delete friend relationships
    const friendsSnapshot = await db
      .collection('friends')
      .where('userId', '==', user.uid)
      .get();

    const batch = db.batch();
    friendsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    console.log(`User data cleaned up for ${user.uid}`);
  } catch (error) {
    console.error('Error cleaning up user data:', error);
  }
});

// ==================== WEATHER FUNCTIONS ====================

/**
 * Notify friends when weather is shared
 */
export const notifyWeatherShare = functions.firestore
  .document('weather/{userId}')
  .onWrite(async (change, context) => {
    const after = change.after.data();
    if (!after) return;

    const { userId, userName, sharedWith, condition } = after;

    try {
      // Notify all friends weather was shared
      if (sharedWith && sharedWith.length > 0) {
        const notificationPromises = sharedWith.map((friendId: string) =>
          sendNotification(
            friendId,
            '🌦️ Weather Share',
            `${userName} is experiencing ${condition}`,
            { type: 'weather', userId }
          )
        );

        await Promise.all(notificationPromises);
        console.log(`Weather share notification sent to ${sharedWith.length} friends`);
      }
    } catch (error) {
      console.error('Error notifying weather share:', error);
    }
  });

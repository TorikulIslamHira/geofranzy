import * as functions from 'firebase-functions';
/**
 * Triggered when user updates location
 * - Check for nearby friends
 * - Log meetings if users are close for long enough
 */
export declare const handleLocationUpdate: functions.CloudFunction<functions.Change<functions.firestore.DocumentSnapshot>>;
/**
 * Broadcast SOS to all friends
 */
export declare const broadcastSOSAlert: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
/**
 * Resolve SOS alert - notify friends that it's resolved
 */
export declare const resolveSOSAlert: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
/**
 * Notify user of friend request
 */
export declare const notifyFriendRequest: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
/**
 * Notify user of friend request acceptance
 */
export declare const notifyFriendRequestAccepted: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
/**
 * Auto-log meetings when two users are <50m for >5 minutes
 * Note: This would typically be called from a scheduled Cloud Function
 * or triggered by a specific endpoint
 */
export declare const autoLogMeetings: functions.CloudFunction<unknown>;
/**
 * Initialize user profile when new user is created
 */
export declare const initializeUserProfile: functions.CloudFunction<import("firebase-admin/auth").UserRecord>;
/**
 * Clean up user data when account is deleted
 */
export declare const cleanupUserData: functions.CloudFunction<import("firebase-admin/auth").UserRecord>;
/**
 * Notify friends when weather is shared
 */
export declare const notifyWeatherShare: functions.CloudFunction<functions.Change<functions.firestore.DocumentSnapshot>>;
//# sourceMappingURL=index.d.ts.map
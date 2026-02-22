import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  GeoPoint,
  serverTimestamp,
  addDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';

// ==================== Friends Management ====================

export interface Friend {
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'rejected';
  addedAt: number;
}

/**
 * Send friend request
 */
export const sendFriendRequest = async (userId: string, friendUserId: string): Promise<void> => {
  try {
    const friendDocRef = doc(collection(db, 'friends'));
    await setDoc(friendDocRef, {
      userId,
      friendId: friendUserId,
      status: 'pending',
      addedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

/**
 * Accept friend request
 */
export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  try {
    const friendRef = doc(db, 'friends', requestId);
    await updateDoc(friendRef, {
      status: 'accepted',
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
};

/**
 * Get friends list
 */
export const getFriendsList = async (userId: string): Promise<Friend[]> => {
  try {
    const friendsRef = collection(db, 'friends');
    const query1 = query(
      friendsRef,
      where('userId', '==', userId),
      where('status', '==', 'accepted')
    );

    const snapshot = await getDocs(query1);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      docId: doc.id,
    })) as Friend[];
  } catch (error) {
    console.error('Error getting friends list:', error);
    throw error;
  }
};

/**
 * Remove friend
 */
export const removeFriend = async (userId: string, friendId: string): Promise<void> => {
  try {
    const friendsRef = collection(db, 'friends');
    const friendQuery = query(
      friendsRef,
      where('userId', '==', userId),
      where('friendId', '==', friendId)
    );

    const snapshot = await getDocs(friendQuery);
    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
    }
  } catch (error) {
    console.error('Error removing friend:', error);
    throw error;
  }
};

// ==================== SOS Alerts ====================

export interface SOSAlert {
  id?: string;
  userId: string;
  userName: string;
  message: string;
  location: GeoPoint;
  timestamp: number;
  status: 'active' | 'resolved';
  recipients: string[];
}

/**
 * Send SOS alert to all friends
 */
export const broadcastSOS = async (
  userId: string,
  userName: string,
  latitude: number,
  longitude: number,
  message: string = 'I need help!'
): Promise<string> => {
  try {
    const sosRef = await addDoc(collection(db, 'sos_alerts'), {
      userId,
      userName,
      message,
      location: new GeoPoint(latitude, longitude),
      timestamp: Date.now(),
      status: 'active',
      recipients: [], // Will be filled by Cloud Function
    });

    return sosRef.id;
  } catch (error) {
    console.error('Error broadcasting SOS:', error);
    throw error;
  }
};

/**
 * Resolve SOS alert
 */
export const resolveSOSAlert = async (sosId: string): Promise<void> => {
  try {
    const sosRef = doc(db, 'sos_alerts', sosId);
    await updateDoc(sosRef, {
      status: 'resolved',
    });
  } catch (error) {
    console.error('Error resolving SOS alert:', error);
    throw error;
  }
};

/**
 * Get active SOS alerts
 */
export const getActiveSOSAlerts = async (): Promise<SOSAlert[]> => {
  try {
    const sosRef = collection(db, 'sos_alerts');
    const sosQuery = query(sosRef, where('status', '==', 'active'));
    const snapshot = await getDocs(sosQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SOSAlert[];
  } catch (error) {
    console.error('Error getting SOS alerts:', error);
    throw error;
  }
};

// ==================== Weather Sharing ====================

export interface WeatherData {
  userId: string;
  userName: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  timestamp: number;
  sharedWith: string[]; // Friend IDs
}

/**
 * Share weather with friends
 */
export const shareWeather = async (
  userId: string,
  userName: string,
  weatherData: {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  },
  friendIds: string[]
): Promise<void> => {
  try {
    const weatherRef = doc(db, 'weather', userId);
    await setDoc(
      weatherRef,
      {
        userId,
        userName,
        ...weatherData,
        timestamp: Date.now(),
        sharedWith: friendIds,
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error sharing weather:', error);
    throw error;
  }
};

/**
 * Get friends' shared weather
 */
export const getFriendsWeather = async (friendIds: string[]): Promise<WeatherData[]> => {
  try {
    if (friendIds.length === 0) return [];

    const weatherRef = collection(db, 'weather');
    const snapshot = await getDocs(weatherRef);

    return snapshot.docs
      .map((doc) => doc.data() as WeatherData)
      .filter((w) => friendIds.includes(w.userId));
  } catch (error) {
    console.error('Error getting friends weather:', error);
    throw error;
  }
};

// ==================== Meeting History ====================

export interface MeetingHistory {
  id?: string;
  user1Id: string;
  user1Name: string;
  user2Id: string;
  user2Name: string;
  meetingTime: number;
  meetingEndTime: number;
  duration: number; // in milliseconds
  location: GeoPoint;
}

/**
 * Log meeting
 */
export const logMeeting = async (
  user1Id: string,
  user1Name: string,
  user2Id: string,
  user2Name: string,
  latitude: number,
  longitude: number,
  durationMs: number
): Promise<string> => {
  try {
    const meetingRef = await addDoc(collection(db, 'meeting_history'), {
      user1Id,
      user1Name,
      user2Id,
      user2Name,
      meetingTime: Date.now() - durationMs,
      meetingEndTime: Date.now(),
      duration: durationMs,
      location: new GeoPoint(latitude, longitude),
    });

    return meetingRef.id;
  } catch (error) {
    console.error('Error logging meeting:', error);
    throw error;
  }
};

/**
 * Get meeting history for user
 */
export const getMeetingHistory = async (userId: string): Promise<MeetingHistory[]> => {
  try {
    const meetingRef = collection(db, 'meeting_history');
    const query1 = query(meetingRef, where('user1Id', '==', userId));
    const query2 = query(meetingRef, where('user2Id', '==', userId));

    const snapshot1 = await getDocs(query1);
    const snapshot2 = await getDocs(query2);

    const meetings: MeetingHistory[] = [];

    snapshot1.docs.forEach((doc) => {
      meetings.push({
        id: doc.id,
        ...doc.data(),
      } as MeetingHistory);
    });

    snapshot2.docs.forEach((doc) => {
      meetings.push({
        id: doc.id,
        ...doc.data(),
      } as MeetingHistory);
    });

    return meetings.sort((a, b) => b.meetingTime - a.meetingTime);
  } catch (error) {
    console.error('Error getting meeting history:', error);
    throw error;
  }
};

// ==================== Ghost Mode ====================

/**
 * Toggle ghost mode (hide location from friends)
 */
export const toggleGhostMode = async (userId: string, enabled: boolean): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ghostMode: enabled,
    });
  } catch (error) {
    console.error('Error toggling ghost mode:', error);
    throw error;
  }
};

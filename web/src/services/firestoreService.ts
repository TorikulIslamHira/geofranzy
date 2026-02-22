import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  onSnapshot,
  GeoPoint,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserLocation, SOSAlert, MeetingRecord, WeatherData, FriendRequest } from '@types';

// ==================== USER FUNCTIONS ====================

export async function getUserProfile(userId: string) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.exists() ? userDoc.data() : null;
}

export async function updateUserProfile(userId: string, data: Partial<any>) {
  await updateDoc(doc(db, 'users', userId), data);
}

export async function toggleGhostMode(userId: string, ghostMode: boolean) {
  await updateDoc(doc(db, 'users', userId), { ghostMode });
}

// ==================== LOCATION FUNCTIONS ====================

export async function updateLocation(userId: string, latitude: number, longitude: number) {
  await setDoc(doc(db, 'locations', userId), {
    userId,
    coordinates: new GeoPoint(latitude, longitude),
    timestamp: Date.now(),
    lastUpdate: serverTimestamp(),
  });
}

export async function getUserLocation(userId: string): Promise<UserLocation | null> {
  const locDoc = await getDoc(doc(db, 'locations', userId));
  if (!locDoc.exists()) return null;

  const data = locDoc.data();
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.data();

  return {
    uid: userId,
    latitude: data.coordinates.latitude,
    longitude: data.coordinates.longitude,
    displayName: userData?.displayName || 'User',
    timestamp: data.timestamp,
    isGhostMode: userData?.ghostMode || false,
  };
}

// ==================== FRIENDS FUNCTIONS ====================

export async function sendFriendRequest(userId: string, friendEmail: string) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', friendEmail));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('User not found');
  }

  const friendId = snapshot.docs[0].id;

  if (friendId === userId) {
    throw new Error('Cannot add yourself as a friend');
  }

  await setDoc(doc(db, 'friends', `${userId}_${friendId}`), {
    userId,
    friendId,
    status: 'pending',
    addedAt: Date.now(),
  });
}

export async function acceptFriendRequest(userId: string, friendId: string) {
  await updateDoc(doc(db, 'friends', `${friendId}_${userId}`), {
    status: 'accepted',
  });

  // Create reciprocal friendship
  await setDoc(doc(db, 'friends', `${userId}_${friendId}`), {
    userId,
    friendId,
    status: 'accepted',
    addedAt: Date.now(),
  });
}

export async function removeFriend(userId: string, friendId: string) {
  await deleteDoc(doc(db, 'friends', `${userId}_${friendId}`));
  await deleteDoc(doc(db, 'friends', `${friendId}_${userId}`));
}

export async function getFriendsList(userId: string): Promise<UserLocation[]> {
  const friendsRef = collection(db, 'friends');
  const q = query(friendsRef, where('userId', '==', userId), where('status', '==', 'accepted'));
  const snapshot = await getDocs(q);

  const friendsLocations: UserLocation[] = [];

  for (const docSnap of snapshot.docs) {
    const friendId = docSnap.data().friendId;
    const location = await getUserLocation(friendId);
    if (location) {
      friendsLocations.push(location);
    }
  }

  return friendsLocations;
}

export async function getPendingFriendRequests(userId: string): Promise<FriendRequest[]> {
  const friendsRef = collection(db, 'friends');
  const q = query(friendsRef, where('friendId', '==', userId), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FriendRequest[];
}

// ==================== SOS FUNCTIONS ====================

export async function broadcastSOS(
  userId: string,
  userName: string,
  latitude: number,
  longitude: number,
  message?: string
) {
  await setDoc(doc(collection(db, 'sos_alerts')), {
    userId,
    userName,
    location: new GeoPoint(latitude, longitude),
    message: message || 'Emergency SOS Alert!',
    timestamp: Date.now(),
    status: 'active',
  });
}

export async function resolveSOSAlert(sosId: string) {
  await updateDoc(doc(db, 'sos_alerts', sosId), {
    status: 'resolved',
    resolvedAt: Date.now(),
  });
}

export async function getActiveSOSAlerts(): Promise<SOSAlert[]> {
  const sosRef = collection(db, 'sos_alerts');
  const q = query(sosRef, where('status', '==', 'active'), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      userName: data.userName,
      location: {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
      },
      timestamp: data.timestamp,
      status: data.status,
      message: data.message,
      recipients: data.recipients,
    };
  });
}

// ==================== WEATHER FUNCTIONS ====================

export async function shareWeather(
  userId: string,
  userName: string,
  weatherData: any,
  friendIds: string[]
) {
  await setDoc(doc(db, 'weather', userId), {
    userId,
    userName,
    temp: weatherData.temp,
    condition: weatherData.condition,
    humidity: weatherData.humidity,
    windSpeed: weatherData.windSpeed,
    timestamp: Date.now(),
    sharedWith: friendIds,
  });
}

export async function getFriendsWeather(userId: string): Promise<WeatherData[]> {
  const weatherRef = collection(db, 'weather');
  const q = query(weatherRef, where('sharedWith', 'array-contains', userId), limit(10));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data()) as WeatherData[];
}

// ==================== MEETING HISTORY ====================

export async function getMeetingHistory(userId: string): Promise<MeetingRecord[]> {
  const meetingsRef = collection(db, 'meeting_history');
  const q1 = query(meetingsRef, where('user1Id', '==', userId), orderBy('meetingTime', 'desc'), limit(50));
  const q2 = query(meetingsRef, where('user2Id', '==', userId), orderBy('meetingTime', 'desc'), limit(50));

  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const meetings: MeetingRecord[] = [
    ...snapshot1.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MeetingRecord)),
    ...snapshot2.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MeetingRecord)),
  ];

  return meetings.sort((a, b) => b.meetingTime - a.meetingTime);
}

// ==================== REAL-TIME LISTENERS ====================

export function subscribeToFriendsLocations(
  userId: string,
  callback: (locations: UserLocation[]) => void
) {
  const friendsRef = collection(db, 'friends');
  const q = query(friendsRef, where('userId', '==', userId), where('status', '==', 'accepted'));

  return onSnapshot(q, async (snapshot) => {
    const friendIds = snapshot.docs.map((doc) => doc.data().friendId);
    const locations: UserLocation[] = [];

    for (const friendId of friendIds) {
      const location = await getUserLocation(friendId);
      if (location) {
        locations.push(location);
      }
    }

    callback(locations);
  });
}

export function subscribeToSOSAlerts(callback: (alerts: SOSAlert[]) => void) {
  const sosRef = collection(db, 'sos_alerts');
  const q = query(sosRef, where('status', '==', 'active'), orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        },
        timestamp: data.timestamp,
        status: data.status,
        message: data.message,
        recipients: data.recipients,
      };
    });
    callback(alerts);
  });
}

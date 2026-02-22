import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onSnapshot,
  query,
  where,
  collection,
  doc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { LocationCoordinates } from '../services/locationService';
import { useAuth } from './AuthContext';

export interface FriendLocation {
  userId: string;
  displayName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  distance?: number; // Distance from current user in meters
  ghostMode?: boolean;
}

interface LocationContextType {
  currentLocation: LocationCoordinates | null;
  friendsLocations: FriendLocation[];
  loading: boolean;
  error: string | null;
  setCurrentLocation: (location: LocationCoordinates | null) => void;
  refreshFriendsLocations: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [friendsLocations, setFriendsLocations] = useState<FriendLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch friends' locations from Firestore
   */
  const refreshFriendsLocations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get user's friend list
      const friendsRef = collection(db, 'friends');
      const friendsQuery = query(friendsRef, where('userId', '==', user.uid));
      const friendsSnapshot = await getDocs(friendsQuery);

      const friendIds = friendsSnapshot.docs
        .filter((doc) => doc.data().status === 'accepted')
        .map((doc) => doc.data().friendId);

      if (friendIds.length === 0) {
        setFriendsLocations([]);
        return;
      }

      // Get locations for each friend
      const locationsRef = collection(db, 'locations');
      const locationsSnapshot = await getDocs(locationsRef);

      const locsMap = new Map();
      locationsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (friendIds.includes(data.userId)) {
          locsMap.set(data.userId, data);
        }
      });

      // Get user profiles for friend names
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      const usersMap = new Map();
      usersSnapshot.docs.forEach((doc) => {
        usersMap.set(doc.id, doc.data());
      });

      // Combine data
      const friendLocs: FriendLocation[] = [];
      for (const [userId, locData] of locsMap.entries()) {
        const userData = usersMap.get(userId);
        if (userData) {
          const geoPoint = locData.coordinates;
          friendLocs.push({
            userId,
            displayName: userData.displayName,
            latitude: geoPoint.latitude,
            longitude: geoPoint.longitude,
            accuracy: locData.accuracy || 0,
            timestamp: locData.timestamp,
            ghostMode: userData.ghostMode,
          });
        }
      }

      setFriendsLocations(friendLocs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch friends locations');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set up real-time listener for friends' locations
   */
  useEffect(() => {
    if (!user) return;

    // Set up listener for location updates (basic implementation)
    // In production, you'd want a more efficient query approach
    const locations = collection(db, 'locations');
    const unsubscribe = onSnapshot(locations, (snapshot) => {
      refreshFriendsLocations();
    });

    return unsubscribe;
  }, [user]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        friendsLocations,
        loading,
        error,
        setCurrentLocation,
        refreshFriendsLocations,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

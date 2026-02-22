import * as Location from 'expo-location';
import { doc, setDoc, GeoPoint } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  speed: number | null;
  heading: number | null;
}

export interface FriendLocation {
  userId: string;
  coordinates: LocationCoordinates;
  timestamp: number;
  batteryLevel?: number;
  lastUpdate: Date;
}

let locationSubscription: Location.LocationSubscription | null = null;

/**
 * Request location permissions
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      // Also request background permission for iOS
      await Location.requestBackgroundPermissionsAsync();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Check if location permission is granted
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};

/**
 * Get current location once
 */
export const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || 0,
      altitude: location.coords.altitude,
      altitudeAccuracy: location.coords.altitudeAccuracy,
      speed: location.coords.speed,
      heading: location.coords.heading,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

/**
 * Start watching location with configurable interval
 */
export const startLocationTracking = async (
  userId: string,
  onLocationChange?: (location: LocationCoordinates) => void,
  intervalMs: number = 30000
): Promise<void> => {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    const unsubscribe = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: intervalMs,
        distanceInterval: 5, // Update if moved 5+ meters
      },
      async (location) => {
        const coordinates: LocationCoordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
          altitude: location.coords.altitude,
          altitudeAccuracy: location.coords.altitudeAccuracy,
          speed: location.coords.speed,
          heading: location.coords.heading,
        };

        // Callback for local updates
        if (onLocationChange) {
          onLocationChange(coordinates);
        }

        // Update Firestore
        try {
          const locationsRef = doc(db, 'locations', userId);
          await setDoc(
            locationsRef,
            {
              userId,
              coordinates: new GeoPoint(coordinates.latitude, coordinates.longitude),
              accuracy: coordinates.accuracy,
              altitude: coordinates.altitude,
              speed: coordinates.speed,
              heading: coordinates.heading,
              timestamp: Date.now(),
              lastUpdate: new Date(),
            },
            { merge: true }
          );

          // Also update user's current location field
          const userRef = doc(db, 'users', userId);
          await setDoc(
            userRef,
            {
              lastLocation: new GeoPoint(coordinates.latitude, coordinates.longitude),
              lastLocationUpdate: Date.now(),
            },
            { merge: true }
          );
        } catch (error) {
          console.error('Error updating location to Firestore:', error);
        }
      }
    );

    locationSubscription = unsubscribe;
  } catch (error) {
    console.error('Error starting location tracking:', error);
    throw error;
  }
};

/**
 * Stop location tracking
 */
export const stopLocationTracking = async (): Promise<void> => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
};

/**
 * Update user location immediately (one-time update)
 */
export const updateLocationOnce = async (userId: string): Promise<void> => {
  try {
    const location = await getCurrentLocation();
    if (!location) return;

    const locationsRef = doc(db, 'locations', userId);
    await setDoc(
      locationsRef,
      {
        userId,
        coordinates: new GeoPoint(location.latitude, location.longitude),
        accuracy: location.accuracy,
        altitude: location.altitude,
        speed: location.speed,
        heading: location.heading,
        timestamp: Date.now(),
        lastUpdate: new Date(),
      },
      { merge: true }
    );

    // Also update user's current location field
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        lastLocation: new GeoPoint(location.latitude, location.longitude),
        lastLocationUpdate: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating location once:', error);
    throw error;
  }
};

/**
 * Clear location data for user
 */
export const clearLocationData = async (userId: string): Promise<void> => {
  try {
    await stopLocationTracking();
    // Note: You may want to keep location history but clear current location
    // For now we just stop tracking
  } catch (error) {
    console.error('Error clearing location data:', error);
  }
};

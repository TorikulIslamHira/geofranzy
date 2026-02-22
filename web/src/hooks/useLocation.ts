import { useEffect } from 'react';
import { useAuthStore, useLocationStore } from '@store';
import { subscribeToFriendsLocations } from '@services/firestoreService';
import { getCurrentLocation, clearLocationWatch } from '@utils/location';
import { updateLocation } from '@services/firestoreService';

export function useLocation() {
  const { user } = useAuthStore();
  const { currentLocation, friendsLocations, setCurrentLocation, setFriendsLocations } =
    useLocationStore();

  useEffect(() => {
    if (!user) return;

    let watchId: number | null = null;

    // Get initial location
    getCurrentLocation()
      .then(async (coords) => {
        setCurrentLocation(coords);
        await updateLocation(user.uid, coords.latitude, coords.longitude);
      })
      .catch((error) => {
        console.error('Error getting location:', error);
      });

    // Watch location updates every 30 seconds
    const updateInterval = setInterval(async () => {
      try {
        const coords = await getCurrentLocation();
        setCurrentLocation(coords);
        await updateLocation(user.uid, coords.latitude, coords.longitude);
      } catch (error) {
        console.error('Error updating location:', error);
      }
    }, 30000);

    // Subscribe to friends' locations
    const unsubscribeFriends = subscribeToFriendsLocations(user.uid, (locations) => {
      setFriendsLocations(locations);
    });

    return () => {
      clearInterval(updateInterval);
      if (watchId !== null) {
        clearLocationWatch(watchId);
      }
      unsubscribeFriends();
    };
  }, [user, setCurrentLocation, setFriendsLocations]);

  return { currentLocation, friendsLocations };
}

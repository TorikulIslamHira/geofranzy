import { create } from 'zustand';
import type { User, UserLocation, SOSAlert } from '@types';

interface AuthStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

interface LocationStore {
  currentLocation: { latitude: number; longitude: number } | null;
  friendsLocations: UserLocation[];
  setCurrentLocation: (location: { latitude: number; longitude: number } | null) => void;
  setFriendsLocations: (locations: UserLocation[]) => void;
  updateFriendLocation: (location: UserLocation) => void;
}

interface SOSStore {
  activeAlerts: SOSAlert[];
  setActiveAlerts: (alerts: SOSAlert[]) => void;
  addAlert: (alert: SOSAlert) => void;
  removeAlert: (alertId: string) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, loading: false }),
}));

export const useLocationStore = create<LocationStore>((set) => ({
  currentLocation: null,
  friendsLocations: [],
  setCurrentLocation: (location) => set({ currentLocation: location }),
  setFriendsLocations: (locations) => set({ friendsLocations: locations }),
  updateFriendLocation: (location) =>
    set((state) => {
      const existing = state.friendsLocations.findIndex((l) => l.uid === location.uid);
      if (existing >= 0) {
        const updated = [...state.friendsLocations];
        updated[existing] = location;
        return { friendsLocations: updated };
      }
      return { friendsLocations: [...state.friendsLocations, location] };
    }),
}));

export const useSOSStore = create<SOSStore>((set) => ({
  activeAlerts: [],
  setActiveAlerts: (alerts) => set({ activeAlerts: alerts }),
  addAlert: (alert) =>
    set((state) => ({ activeAlerts: [...state.activeAlerts, alert] })),
  removeAlert: (alertId) =>
    set((state) => ({
      activeAlerts: state.activeAlerts.filter((alert) => alert.id !== alertId),
    })),
}));

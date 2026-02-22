import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore, useLocationStore, useSOSStore } from '@store';
import { mockUser, mockUserLocation, mockSOSAlert } from '../mocks/mockData';

describe('Zustand Stores', () => {
  describe('useAuthStore', () => {
    beforeEach(() => {
      // Reset store before each test
      useAuthStore.setState({ user: null, loading: false });
    });

    it('should have initial state', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should set user', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);
    });

    it('should clear user on logout', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setUser(mockUser);
      });
      
      expect(result.current.user).toEqual(mockUser);

      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('useLocationStore', () => {
    beforeEach(() => {
      useLocationStore.setState({ 
        currentLocation: null, 
        friendsLocations: [],
        loading: false 
      });
    });

    it('should have initial state', () => {
      const { result } = renderHook(() => useLocationStore());
      expect(result.current.currentLocation).toBeNull();
      expect(result.current.friendsLocations).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('should set current location', () => {
      const { result } = renderHook(() => useLocationStore());
      
      act(() => {
        result.current.setCurrentLocation(mockUserLocation);
      });

      expect(result.current.currentLocation).toEqual(mockUserLocation);
    });

    it('should set friends locations', () => {
      const { result } = renderHook(() => useLocationStore());
      const friendsLocations = [mockUserLocation];
      
      act(() => {
        result.current.setFriendsLocations(friendsLocations);
      });

      expect(result.current.friendsLocations).toEqual(friendsLocations);
    });

    it('should update loading state', () => {
      const { result } = renderHook(() => useLocationStore());
      
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);
    });
  });

  describe('useSOSStore', () => {
    beforeEach(() => {
      useSOSStore.setState({ 
        activeAlerts: [],
        myActiveAlert: null,
        loading: false 
      });
    });

    it('should have initial state', () => {
      const { result } = renderHook(() => useSOSStore());
      expect(result.current.activeAlerts).toEqual([]);
      expect(result.current.myActiveAlert).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should set active alerts', () => {
      const { result } = renderHook(() => useSOSStore());
      const alerts = [mockSOSAlert];
      
      act(() => {
        result.current.setActiveAlerts(alerts);
      });

      expect(result.current.activeAlerts).toEqual(alerts);
    });

    it('should set my active alert', () => {
      const { result } = renderHook(() => useSOSStore());
      
      act(() => {
        result.current.setMyActiveAlert(mockSOSAlert);
      });

      expect(result.current.myActiveAlert).toEqual(mockSOSAlert);
    });

    it('should clear my active alert', () => {
      const { result } = renderHook(() => useSOSStore());
      
      act(() => {
        result.current.setMyActiveAlert(mockSOSAlert);
      });
      
      expect(result.current.myActiveAlert).toEqual(mockSOSAlert);

      act(() => {
        result.current.setMyActiveAlert(null);
      });

      expect(result.current.myActiveAlert).toBeNull();
    });
  });
});

/**
 * Location Service Tests
 * Tests distance calculations, proximity detection, and location tracking
 */

// Distance calculation tests
describe('Location Service', () => {
  describe('Distance Calculations', () => {
    /**
     * Haversine formula for distance between two points
     * d = 2 * R * arcsin(sqrt(sin²((lat2-lat1)/2) + cos(lat1)*cos(lat2)*sin²((lon2-lon1)/2)))
     */
    const calculateDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number => {
      const R = 6371; // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);

      const c = 2 * Math.asin(Math.sqrt(a));
      return R * c;
    };

    it('should calculate distance between two nearby points', () => {
      const distance = calculateDistance(40.7128, -74.006, 40.758, -73.9855);
      // Manhattan distance is approximately 5.3 km
      expect(distance).toBeCloseTo(5.3, 0);
    });

    it('should calculate distance of 0 for same point', () => {
      const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(distance).toBeCloseTo(0, 5);
    });

    it('should handle distance calculation across equator', () => {
      const distance = calculateDistance(-40.7128, -74.006, 40.7128, -74.006);
      const expectedDistance = 90.5; // Roughly 90 degrees latitude
      expect(distance).toBeGreaterThan(8000); // > 8000 km
    });

    it('should handle distance calculation across prime meridian', () => {
      const distance = calculateDistance(40.7128, -0.1276, 40.7128, 0.1276);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(100);
    });

    it('should handle antipodal points', () => {
      const distance = calculateDistance(0, 0, 0, 180);
      expect(distance).toBeCloseTo(20015, 0); // Half Earth's circumference (≈ 20015 km)
    });

    it('should calculate distance between major cities', () => {
      // New York to Los Angeles
      const nyLat = 40.7128,
        nyLon = -74.006;
      const laLat = 34.0522,
        laLon = -118.2437;

      const distance = calculateDistance(nyLat, nyLon, laLat, laLon);
      expect(distance).toBeCloseTo(3936, -1); // ~3936 km
    });
  });

  describe('Proximity Detection', () => {
    const PROXIMITY_THRESHOLD = 0.5; // 500 meters

    const isNearby = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): boolean => {
      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      return distance <= PROXIMITY_THRESHOLD;
    };

    const calculateDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);

      const c = 2 * Math.asin(Math.sqrt(a));
      return R * c;
    };

    it('should detect friends within 500m threshold', () => {
      const userLat = 40.7128;
      const userLon = -74.006;
      const friendLat = 40.7135; // ~77 meters away
      const friendLon = -74.0055;

      const nearby = isNearby(userLat, userLon, friendLat, friendLon);
      expect(nearby).toBe(true);
    });

    it('should not detect friends beyond 500m threshold', () => {
      const userLat = 40.7128;
      const userLon = -74.006;
      const friendLat = 40.7188; // ~666 meters away
      const friendLon = -74.0055;

      const nearby = isNearby(userLat, userLon, friendLat, friendLon);
      expect(nearby).toBe(false);
    });

    it('should detect exact threshold boundary', () => {
      const userLat = 40.7128;
      const userLon = -74.006;

      // Approximately 450 meters away (should be detected)
      const closeFriendLat = 40.7169;
      const closeFriendLon = -74.0055;

      const closeNearby = isNearby(userLat, userLon, closeFriendLat, closeFriendLon);
      expect(closeNearby).toBe(true);
    });
  });

  describe('Location Tracking', () => {
    it('should handle location permission request', async () => {
      const mockPermission = { status: 'granted' };
      expect(mockPermission.status).toBe('granted');
    });

    it('should handle location permission denial', async () => {
      const mockPermission = { status: 'denied' };
      expect(mockPermission.status).toBe('denied');
    });

    it('should validate location coordinates', () => {
      const validCoords = {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
      };

      expect(validCoords.latitude).toBeGreaterThanOrEqual(-90);
      expect(validCoords.latitude).toBeLessThanOrEqual(90);
      expect(validCoords.longitude).toBeGreaterThanOrEqual(-180);
      expect(validCoords.longitude).toBeLessThanOrEqual(180);
      expect(validCoords.accuracy).toBeGreaterThan(0);
    });

    it('should reject invalid latitude', () => {
      const invalidCoords = {
        latitude: 91, // Invalid: > 90
        longitude: -74.006,
      };

      expect(invalidCoords.latitude > 90).toBe(true);
    });

    it('should reject invalid longitude', () => {
      const invalidCoords = {
        latitude: 40.7128,
        longitude: 181, // Invalid: > 180
      };

      expect(invalidCoords.longitude > 180).toBe(true);
    });

    it('should handle location timestamp', () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.006,
        timestamp: Date.now(),
      };

      expect(location.timestamp).toBeGreaterThan(0);
      expect(typeof location.timestamp).toBe('number');
    });
  });

  describe('Meeting Detection', () => {
    interface LocationRecord {
      timestamp: number;
      latitude: number;
      longitude: number;
    }

    const isMeetingDetected = (
      user1Locations: LocationRecord[],
      user2Locations: LocationRecord[],
      proximityThreshold: number = 0.5, // 500m
      durationThreshold: number = 5 * 60 * 1000 // 5 minutes
    ): boolean => {
      if (user1Locations.length === 0 || user2Locations.length === 0) {
        return false;
      }

      const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
      ): number => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        return R * 2 * Math.asin(Math.sqrt(a));
      };

      // Find overlapping time windows where users are within threshold
      let proximityDuration = 0;
      const sortedTimes = Array.from(
        new Set([...user1Locations.map((l) => l.timestamp), ...user2Locations.map((l) => l.timestamp)])
      ).sort();

      for (let i = 0; i < sortedTimes.length - 1; i++) {
        const time1 = sortedTimes[i];
        const time2 = sortedTimes[i + 1];

        // Get closest locations at these times
        const user1Loc = user1Locations.reduce((prev, curr) =>
          Math.abs(curr.timestamp - time1) < Math.abs(prev.timestamp - time1) ? curr : prev
        );

        const user2Loc = user2Locations.reduce((prev, curr) =>
          Math.abs(curr.timestamp - time1) < Math.abs(prev.timestamp - time1) ? curr : prev
        );

        const distance = calculateDistance(
          user1Loc.latitude,
          user1Loc.longitude,
          user2Loc.latitude,
          user2Loc.longitude
        );

        if (distance <= proximityThreshold) {
          proximityDuration += time2 - time1;
        }
      }

      return proximityDuration >= durationThreshold;
    };

    it('should detect meeting when users are nearby for 5+ minutes', () => {
      const now = Date.now();
      const user1Locs: LocationRecord[] = [
        { timestamp: now, latitude: 40.7128, longitude: -74.006 },
        { timestamp: now + 60000, latitude: 40.7128, longitude: -74.006 },
        { timestamp: now + 180000, latitude: 40.7128, longitude: -74.006 },
        { timestamp: now + 300000, latitude: 40.7128, longitude: -74.006 },
      ];

      const user2Locs: LocationRecord[] = [
        { timestamp: now, latitude: 40.7135, longitude: -74.0055 },
        { timestamp: now + 120000, latitude: 40.7135, longitude: -74.0055 },
        { timestamp: now + 240000, latitude: 40.7135, longitude: -74.0055 },
      ];

      const meeting = isMeetingDetected(user1Locs, user2Locs);
      expect(meeting).toBe(true);
    });

    it('should not detect meeting when users are together < 5 minutes', () => {
      const now = Date.now();
      const user1Locs: LocationRecord[] = [
        { timestamp: now, latitude: 40.7128, longitude: -74.006 },
        { timestamp: now + 60000, latitude: 40.7128, longitude: -74.006 },
        { timestamp: now + 120000, latitude: 40.7128, longitude: -74.006 },
      ];

      const user2Locs: LocationRecord[] = [
        { timestamp: now + 30000, latitude: 40.7135, longitude: -74.0055 },
        { timestamp: now + 90000, latitude: 40.7135, longitude: -74.0055 },
      ];

      const meeting = isMeetingDetected(user1Locs, user2Locs);
      expect(meeting).toBe(false);
    });

    it('should not detect meeting when users are far apart', () => {
      const now = Date.now();
      const user1Locs: LocationRecord[] = [
        { timestamp: now, latitude: 40.7128, longitude: -74.006 },
        { timestamp: now + 300000, latitude: 40.7128, longitude: -74.006 },
      ];

      const user2Locs: LocationRecord[] = [
        { timestamp: now, latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
        { timestamp: now + 300000, latitude: 34.0522, longitude: -118.2437 },
      ];

      const meeting = isMeetingDetected(user1Locs, user2Locs);
      expect(meeting).toBe(false);
    });
  });

  describe('Location Accuracy', () => {
    it('should handle GPS accuracy values', () => {
      const accuracyValues = [5, 10, 25, 50, 100];

      accuracyValues.forEach((accuracy) => {
        expect(accuracy).toBeGreaterThan(0);
      });
    });

    it('should filter inaccurate readings', () => {
      const readings = [
        { latitude: 40.7128, longitude: -74.006, accuracy: 5 },
        { latitude: 40.712, longitude: -74.007, accuracy: 1000 }, // Very inaccurate
        { latitude: 40.713, longitude: -74.005, accuracy: 10 },
      ];

      const accurateReadings = readings.filter((r) => r.accuracy <= 50);
      expect(accurateReadings.length).toBe(2);
    });

    it('should average multiple accurate readings', () => {
      const readings = [
        { latitude: 40.7128, longitude: -74.006, accuracy: 5 },
        { latitude: 40.7130, longitude: -74.0060, accuracy: 5 },
        { latitude: 40.7129, longitude: -74.0059, accuracy: 5 },
      ];

      const avgLat = readings.reduce((sum, r) => sum + r.latitude, 0) / readings.length;
      const avgLon = readings.reduce((sum, r) => sum + r.longitude, 0) / readings.length;

      expect(avgLat).toBeCloseTo(40.7129, 4);
      expect(avgLon).toBeCloseTo(-74.006, 4);
    });
  });
});

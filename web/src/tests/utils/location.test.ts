import { describe, it, expect, vi } from 'vitest';
import { calculateDistance, formatDistance, getCurrentLocation } from '@utils/location';

describe('Location Utilities', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two close points', () => {
      // New York City - Times Square to Central Park (approx 2km)
      const distance = calculateDistance(40.7580, -73.9855, 40.7829, -73.9654);
      expect(distance).toBeGreaterThan(2000);
      expect(distance).toBeLessThan(3000);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });

    it('should calculate distance between far points', () => {
      // New York to Los Angeles (approx 3944 km)
      const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
      expect(distance).toBeGreaterThan(3900000);
      expect(distance).toBeLessThan(4000000);
    });

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-33.8688, 151.2093, 51.5074, -0.1278);
      // Sydney to London (approx 17000 km)
      expect(distance).toBeGreaterThan(16000000);
      expect(distance).toBeLessThan(18000000);
    });

    it('should be symmetric', () => {
      const d1 = calculateDistance(40.7128, -74.0060, 51.5074, -0.1278);
      const d2 = calculateDistance(51.5074, -0.1278, 40.7128, -74.0060);
      expect(d1).toBeCloseTo(d2, 0);
    });
  });

  describe('formatDistance', () => {
    it('should format meters when less than 1000', () => {
      expect(formatDistance(0)).toBe('0m');
      expect(formatDistance(50)).toBe('50m');
      expect(formatDistance(500)).toBe('500m');
      expect(formatDistance(999)).toBe('999m');
    });

    it('should format kilometers when 1000 or more', () => {
      expect(formatDistance(1000)).toBe('1.0km');
      expect(formatDistance(1500)).toBe('1.5km');
      expect(formatDistance(2345)).toBe('2.3km');
      expect(formatDistance(10000)).toBe('10.0km');
    });

    it('should round meters to nearest integer', () => {
      expect(formatDistance(123.4)).toBe('123m');
      expect(formatDistance(123.9)).toBe('124m');
    });

    it('should show one decimal place for kilometers', () => {
      expect(formatDistance(1234)).toBe('1.2km');
      expect(formatDistance(5678)).toBe('5.7km');
    });
  });

  describe('getCurrentLocation', () => {
    it('should return current position', async () => {
      const position = await getCurrentLocation();
      expect(position).toHaveProperty('latitude');
      expect(position).toHaveProperty('longitude');
      expect(position.latitude).toBe(40.7128);
      expect(position.longitude).toBe(-74.0060);
    });

    it('should reject when geolocation is not available', async () => {
      const originalGeolocation = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        configurable: true,
      });

      await expect(getCurrentLocation()).rejects.toThrow('Geolocation is not supported');

      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true,
      });
    });
  });
});

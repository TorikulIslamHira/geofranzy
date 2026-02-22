import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock Geolocation API
const mockGeolocation = {
  getCurrentPosition: (success: PositionCallback) => {
    const coords: GeolocationCoordinates = {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON() { return this; },
    };
    const position: GeolocationPosition = {
      coords,
      timestamp: Date.now(),
      toJSON() { return this; },
    };
    success(position);
  },
  watchPosition: () => 1,
  clearWatch: () => {},
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Suppress console errors in tests (optional)
// global.console.error = () => {};

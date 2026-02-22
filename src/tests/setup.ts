// Setup file for Jest tests

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({
    status: 'granted',
  })),
  requestBackgroundPermissionsAsync: jest.fn(async () => ({
    status: 'granted',
  })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 0,
      accuracy: 10,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
  })),
  watchPositionAsync: jest.fn(async () => ({
    remove: jest.fn(),
  })),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(async () => ({
    status: 'granted',
  })),
  getExpoPushTokenAsync: jest.fn(async () => ({
    data: 'ExponentPushToken[test-token]',
  })),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    __esModule: true,
    default: (props: any) => React.createElement(View, props),
    Marker: (props: any) => React.createElement(View, props),
    Circle: (props: any) => React.createElement(View, props),
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock Firebase
jest.mock('@services/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  },
  db: {},
  storage: {},
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

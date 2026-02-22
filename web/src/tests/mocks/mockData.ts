import { User, UserLocation, SOSAlert, MeetingRecord } from '@types';

export const mockUser: User = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  friends: ['friend-1', 'friend-2'],
  friendRequests: [],
  settings: {
    shareLocation: true,
    ghostMode: false,
    notificationsEnabled: true,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

export const mockUserLocation: UserLocation = {
  uid: 'test-user-123',
  latitude: 40.7128,
  longitude: -74.0060,
  displayName: 'Test User',
  timestamp: new Date(),
  isGhostMode: false,
};

export const mockSOSAlert: SOSAlert = {
  id: 'sos-123',
  userId: 'test-user-123',
  userName: 'Test User',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
  },
  message: 'Need help!',
  timestamp: new Date(),
  status: 'active',
  recipients: ['friend-1', 'friend-2'],
};

export const mockMeetingRecord: MeetingRecord = {
  id: 'meeting-123',
  user1Id: 'test-user-123',
  user2Id: 'friend-1',
  user1Name: 'Test User',
  user2Name: 'Friend One',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
  },
  startTime: new Date('2024-01-15T10:00:00'),
  endTime: new Date('2024-01-15T11:00:00'),
  duration: 60,
};

export const mockFriends: User[] = [
  {
    uid: 'friend-1',
    email: 'friend1@example.com',
    displayName: 'Friend One',
    photoURL: null,
    friends: ['test-user-123'],
    friendRequests: [],
    settings: {
      shareLocation: true,
      ghostMode: false,
      notificationsEnabled: true,
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    uid: 'friend-2',
    email: 'friend2@example.com',
    displayName: 'Friend Two',
    photoURL: null,
    friends: ['test-user-123'],
    friendRequests: [],
    settings: {
      shareLocation: true,
      ghostMode: true,
      notificationsEnabled: true,
    },
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-15'),
  },
];

export const mockFriendsLocations: UserLocation[] = [
  {
    uid: 'friend-1',
    latitude: 40.7139,
    longitude: -74.0065,
    displayName: 'Friend One',
    timestamp: new Date(),
    isGhostMode: false,
  },
  {
    uid: 'friend-2',
    latitude: 40.7150,
    longitude: -74.0080,
    displayName: 'Friend Two',
    timestamp: new Date(),
    isGhostMode: true,
  },
];

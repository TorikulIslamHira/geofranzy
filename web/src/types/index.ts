/**
 * Common type definitions for Geofranzy Web
 */

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  ghostMode?: boolean;
  createdAt?: Date;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface UserLocation extends LocationCoordinates {
  uid: string;
  displayName: string;
  timestamp: number;
  isGhostMode: boolean;
  distance?: number;
}

export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  location: LocationCoordinates;
  timestamp: number;
  status: 'active' | 'resolved';
  message?: string;
  recipients?: string[];
}

export interface MeetingRecord {
  id: string;
  user1Id: string;
  user1Name: string;
  user2Id: string;
  user2Name: string;
  meetingTime: number;
  meetingEndTime?: number;
  duration: number;
  location: LocationCoordinates;
}

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  userId: string;
  userName: string;
  timestamp: number;
}

export interface FriendRequest {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'rejected';
  addedAt: number;
}

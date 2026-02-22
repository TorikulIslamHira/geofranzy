/**
 * Common type definitions for the Geofranzy application
 */

/**
 * User types
 */
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: Date;
}

/**
 * Location types
 */
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface UserLocation extends LocationCoordinates {
  uid: string;
  displayName?: string;
  timestamp: Date;
  isGhostMode?: boolean;
}

/**
 * SOS Alert types
 */
export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  location: LocationCoordinates;
  timestamp: Date;
  isActive: boolean;
  message?: string;
}

/**
 * Meeting History types
 */
export interface MeetingRecord {
  id: string;
  userIds: string[];
  location: LocationCoordinates;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

/**
 * Weather types
 */
export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
}

/**
 * Notification types
 */
export interface NotificationData {
  type: 'proximity' | 'sos' | 'weather' | 'general';
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Navigation types
 */
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  SOS: undefined;
  Weather: undefined;
  History: undefined;
  Profile: undefined;
};

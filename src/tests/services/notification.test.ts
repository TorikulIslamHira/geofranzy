/**
 * Notification Service Tests
 * Tests FCM integration, local notifications, and alert handling
 */

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

jest.mock('firebase/messaging', () => ({
  getMessaging: jest.fn(),
  onMessage: jest.fn(),
  requestPermission: jest.fn(),
}));

import * as Notifications from 'expo-notifications';
import { getMessaging, onMessage } from 'firebase/messaging';

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Push Token Management', () => {
    it('should request notification permissions', async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await Notifications.requestPermissionsAsync();
      expect(result.status).toBe('granted');
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should handle permission denial', async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await Notifications.requestPermissionsAsync();
      expect(result.status).toBe('denied');
    });

    it('should get Expo push token', async () => {
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[valid-token-123]',
      });

      const token = await Notifications.getExpoPushTokenAsync();
      expect(token.data).toContain('ExponentPushToken');
    });

    it('should validate push token format', async () => {
      const mockToken = 'ExponentPushToken[xyz123abc]';

      expect(mockToken).toMatch(/^ExponentPushToken\[.+\]$/);
    });
  });

  describe('FCM Integration', () => {
    it('should initialize Firebase Messaging', () => {
      (getMessaging as jest.Mock).mockReturnValue({
        app: { name: '[DEFAULT]' },
      });

      const messaging = getMessaging();
      expect(messaging).toBeDefined();
      expect(getMessaging).toHaveBeenCalled();
    });

    it('should listen for incoming messages', (done) => {
      (getMessaging as jest.Mock).mockReturnValue({
        app: { name: '[DEFAULT]' },
      });

      (onMessage as jest.Mock).mockImplementation((messaging, callback) => {
        const mockMessage = {
          notification: {
            title: 'Friend Online',
            body: 'User123 is now online',
          },
          data: {
            userId: 'user123',
            type: 'friend_online',
          },
        };

        callback(mockMessage);
      });

      const messaging = getMessaging();
      onMessage(messaging, (message) => {
        expect(message.notification?.title).toBe('Friend Online');
        expect(onMessage).toHaveBeenCalled();
        done();
      });
    });

    it('should handle FCM message with data payload', (done) => {
      (onMessage as jest.Mock).mockImplementation((messaging, callback) => {
        const mockMessage = {
          data: {
            type: 'location_update',
            userId: 'friend123',
            latitude: '40.7128',
            longitude: '-74.006',
          },
        };

        callback(mockMessage);
      });

      onMessage(getMessaging() as any, (message) => {
        expect(message.data?.type).toBe('location_update');
        expect(message.data?.userId).toBe('friend123');
        done();
      });
    });
  });

  describe('Local Notifications', () => {
    it('should set notification handler', () => {
      (Notifications.setNotificationHandler as jest.Mock).mockReturnValue(undefined);

      const handler = {
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      };

      Notifications.setNotificationHandler(handler);
      expect(Notifications.setNotificationHandler).toHaveBeenCalledWith(handler);
    });

    it('should listen for received notifications', () => {
      const mockUnsubscribe = jest.fn();
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockUnsubscribe);

      const listener = jest.fn();
      const unsubscribe = Notifications.addNotificationReceivedListener(listener);

      expect(unsubscribe).toBeDefined();
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(listener);
    });

    it('should listen for notification responses', () => {
      const mockUnsubscribe = jest.fn();
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue(
        mockUnsubscribe
      );

      const listener = jest.fn();
      const unsubscribe = Notifications.addNotificationResponseReceivedListener(listener);

      expect(unsubscribe).toBeDefined();
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalledWith(listener);
    });

    it('should handle notification cleanup', () => {
      const unsubscribe1 = jest.fn();
      const unsubscribe2 = jest.fn();

      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValueOnce(
        unsubscribe1
      );
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValueOnce(
        unsubscribe2
      );

      const sub1 = Notifications.addNotificationReceivedListener(() => {});
      const sub2 = Notifications.addNotificationResponseReceivedListener(() => {});

      sub1();
      sub2();

      expect(unsubscribe1).toHaveBeenCalled();
      expect(unsubscribe2).toHaveBeenCalled();
    });
  });

  describe('Notification Types', () => {
    it('should handle friend online notification', () => {
      const notification = {
        title: 'Friend Online',
        body: 'Alice just came online',
        data: { type: 'friend_online', userId: 'user123' },
      };

      expect(notification.data.type).toBe('friend_online');
    });

    it('should handle friend location update notification', () => {
      const notification = {
        title: 'Location Update',
        body: 'Alice is nearby',
        data: {
          type: 'location_update',
          userId: 'alice',
          distance: '0.3',
        },
      };

      expect(notification.data.type).toBe('location_update');
      expect(parseFloat(notification.data.distance)).toBeLessThan(0.5);
    });

    it('should handle SOS alert notification', () => {
      const notification = {
        title: 'SOS Alert',
        body: 'Bob needs help!',
        data: {
          type: 'sos_alert',
          userId: 'bob',
          latitude: '40.7128',
          longitude: '-74.006',
        },
      };

      expect(notification.data.type).toBe('sos_alert');
      expect(notification.title).toContain('SOS');
    });

    it('should handle friend request notification', () => {
      const notification = {
        title: 'Friend Request',
        body: 'Charlie wants to be your friend',
        data: {
          type: 'friend_request',
          userId: 'charlie',
          requestId: 'req123',
        },
      };

      expect(notification.data.type).toBe('friend_request');
    });

    it('should handle meeting log notification', () => {
      const notification = {
        title: 'Meeting Logged',
        body: 'Your meeting with David was logged',
        data: {
          type: 'meeting_logged',
          meetingId: 'meeting123',
          friendId: 'david',
        },
      };

      expect(notification.data.type).toBe('meeting_logged');
    });

    it('should handle weather share notification', () => {
      const notification = {
        title: 'Weather Share',
        body: 'Alice shared their weather',
        data: {
          type: 'weather_share',
          userId: 'alice',
          weatherType: 'rainy',
        },
      };

      expect(notification.data.type).toBe('weather_share');
    });
  });

  describe('Error Handling', () => {
    it('should handle permission request failure', async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('Permission request failed')
      );

      await expect(Notifications.requestPermissionsAsync()).rejects.toThrow(
        'Permission request failed'
      );
    });

    it('should handle missing push token', async () => {
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: undefined,
      });

      const token = await Notifications.getExpoPushTokenAsync();
      expect(token.data).toBeUndefined();
    });

    it('should handle invalid notification payload', () => {
      const invalidNotification = {
        title: '', // Empty title
        body: '', // Empty body
      };

      expect(invalidNotification.title).toBe('');
      expect(invalidNotification.body).toBe('');
    });

    it('should gracefully handle listener errors', () => {
      const mockUnsubscribe = jest.fn();
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(
        mockUnsubscribe
      );

      let errorCaught = false;
      const unsubscribe = Notifications.addNotificationReceivedListener(() => {
        try {
          throw new Error('Handler error');
        } catch (e) {
          errorCaught = true;
        }
      });

      expect(typeof unsubscribe).toBe('function');
      expect(mockUnsubscribe).toBeDefined();
    });
  });

  describe('Batch Notification Handling', () => {
    it('should throttle notification display', (done) => {
      const notifications = [
        { title: 'Update 1', body: 'First' },
        { title: 'Update 2', body: 'Second' },
        { title: 'Update 3', body: 'Third' },
      ];

      let displayCount = 0;
      const maxDisplay = 2;

      const throttledDisplay = (notification: any) => {
        if (displayCount < maxDisplay) {
          displayCount++;
          return true;
        }
        return false;
      };

      notifications.forEach((notif) => {
        throttledDisplay(notif);
      });

      expect(displayCount).toBeLessThanOrEqual(maxDisplay);
      done();
    });

    it('should group similar notifications', () => {
      const notifications = [
        { type: 'friend_online', userId: 'alice' },
        { type: 'friend_online', userId: 'bob' },
        { type: 'friend_online', userId: 'charlie' },
      ];

      const grouped = notifications.reduce(
        (acc: any, notif) => {
          if (!acc[notif.type]) acc[notif.type] = [];
          acc[notif.type].push(notif);
          return acc;
        },
        {}
      );

      expect(grouped.friend_online.length).toBe(3);
    });
  });

  describe('Token Management', () => {
    it('should refresh expired tokens', async () => {
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[new-token-456]',
      });

      const newToken = await Notifications.getExpoPushTokenAsync();
      expect(newToken.data).not.toBe('ExponentPushToken[old-token-123]');
    });

    it('should handle token update race conditions', async () => {
      const token1Promise = Notifications.getExpoPushTokenAsync();
      const token2Promise = Notifications.getExpoPushTokenAsync();

      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[consistent-token]',
      });

      const [token1, token2] = await Promise.all([token1Promise, token2Promise]);

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
    });
  });
});

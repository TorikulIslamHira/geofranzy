import * as Notifications from 'expo-notifications';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// Handle notification when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Let the app decide whether to show the notification
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

export interface NotificationData {
  type: 'nearby' | 'sos' | 'weather' | 'friend_request' | 'meeting_logged';
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Initialize notifications
 */
export const initializeNotifications = async (userId: string): Promise<void> => {
  try {
    // Get notification permissions
    const existingPerms = await Notifications.getPermissionsAsync() as any;
    let isGranted = existingPerms.granted ?? existingPerms.status === 'granted';

    if (!isGranted) {
      const newPerms = await Notifications.requestPermissionsAsync() as any;
      isGranted = newPerms.granted ?? newPerms.status === 'granted';
    }

    if (!isGranted) {
      console.warn('Notification permissions not granted');
      return;
    }

    // Get device push token
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Store FCM token in Firestore (for native Firebase Messaging)
    // For Expo, we store the Expo push token
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        expoPushToken: token,
        notificationsEnabled: true,
      },
      { merge: true }
    );

    console.log('Notifications initialized, token:', token);
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

/**
 * Send local notification
 */
export const sendLocalNotification = async (data: NotificationData): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title,
        body: data.body,
        data: {
          type: data.type,
          ...data.data,
        },
      },
      trigger: {
        seconds: 1,
      },
    });
  } catch (error) {
    console.error('Error sending local notification:', error);
  }
};

/**
 * Send nearby alert notification
 */
export const sendNearbyNotification = async (friendName: string, distance: number): Promise<void> => {
  await sendLocalNotification({
    type: 'nearby',
    title: 'Nearby Alert! 📍',
    body: `${friendName} is nearby (${Math.round(distance)}m away)`,
    data: { friendName, distance },
  });
};

/**
 * Send SOS alert notification
 */
export const sendSOSNotification = async (friendName: string): Promise<void> => {
  await sendLocalNotification({
    type: 'sos',
    title: 'Emergency SOS! 🆘',
    body: `${friendName} sent an emergency SOS alert`,
    data: { friendName },
  });
};

/**
 * Send weather share notification
 */
export const sendWeatherNotification = async (friendName: string, weather: string): Promise<void> => {
  await sendLocalNotification({
    type: 'weather',
    title: 'Weather Share 🌦️',
    body: `${friendName} shared: ${weather}`,
    data: { friendName, weather },
  });
};

/**
 * Send friend request notification
 */
export const sendFriendRequestNotification = async (friendName: string): Promise<void> => {
  await sendLocalNotification({
    type: 'friend_request',
    title: 'New Friend Request 👋',
    body: `${friendName} sent you a friend request`,
    data: { friendName },
  });
};

/**
 * Send meeting logged notification
 */
export const sendMeetingNotification = async (friendName: string, duration: number): Promise<void> => {
  await sendLocalNotification({
    type: 'meeting_logged',
    title: 'Meeting Logged 📝',
    body: `You met ${friendName} for ${Math.round(duration / 60)} minutes`,
    data: { friendName, duration },
  });
};

/**
 * Set up notification event listeners
 */
export const setupNotificationListeners = (
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (notification: Notifications.Notification) => void
): (() => void) => {
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (onNotificationTapped) {
      onNotificationTapped(response.notification);
    }
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};

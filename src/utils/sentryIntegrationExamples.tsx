/**
 * Sentry Integration Examples for GeoFrenzy App
 * Practical examples showing how to use Sentry utilities with existing services
 */

/**
 * ==========================================
 * 1. AUTH CONTEXT INTEGRATION
 * ==========================================
 */

// Example AuthContext with Sentry integration
import {
  setSentryUserWeb,
  clearSentryUserWeb,
  captureExceptionWeb,
  addBreadcrumbWeb,
} from '@/src/utils/sentryWeb';

import {
  setSentryUserRN,
  clearSentryUserRN,
  captureExceptionRN,
} from '@/src/utils/sentryRN';

export async function handleLogin(email: string, password: string) {
  try {
    addBreadcrumbWeb('Login attempt', 'auth', 'info');

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // Set Sentry user context
    setSentryUserWeb(user.uid, user.email || undefined, user.displayName || undefined);
    setSentryUserRN(user.uid, user.email || undefined, user.displayName || undefined);

    addBreadcrumbWeb('Login successful', 'auth', 'info');

    return user;
  } catch (error) {
    addBreadcrumbWeb('Login failed', 'auth', 'error');
    captureExceptionWeb(error, {
      action: 'login',
      email: email,
    });
    captureExceptionRN(error, {
      action: 'login',
      email: email,
    });
    throw error;
  }
}

export async function handleLogout() {
  try {
    await signOut(auth);

    // Clear Sentry user context
    clearSentryUserWeb();
    clearSentryUserRN();

    addBreadcrumbWeb('Logout successful', 'auth', 'info');
  } catch (error) {
    captureExceptionWeb(error, { action: 'logout' });
    captureExceptionRN(error, { action: 'logout' });
    throw error;
  }
}

export async function handleSignup(
  email: string,
  password: string,
  username: string
) {
  try {
    addBreadcrumbWeb('Signup attempt', 'auth', 'info');

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // Update profile
    await updateProfile(user, {
      displayName: username,
    });

    // Set Sentry user context
    setSentryUserWeb(user.uid, email, username);
    setSentryUserRN(user.uid, email, username);

    addBreadcrumbWeb('Signup successful', 'auth', 'info');

    return user;
  } catch (error) {
    addBreadcrumbWeb('Signup failed', 'auth', 'error');
    captureExceptionWeb(error, {
      action: 'signup',
      email: email,
    });
    captureExceptionRN(error, {
      action: 'signup',
      email: email,
    });
    throw error;
  }
}

/**
 * ==========================================
 * 2. LOCATION SERVICE INTEGRATION
 * ==========================================
 */

// Example locationService with Sentry integration
import { trackLocationUpdate } from '@/src/utils/sentryRN';

export async function watchLocation() {
  return new Promise((resolve, reject) => {
    const subscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        const { latitude, longitude, accuracy } = location.coords;

        try {
          // Track location update for monitoring
          trackLocationUpdate(latitude, longitude, accuracy);

          // Emit location to context
          onLocationUpdate({
            latitude,
            longitude,
            accuracy,
            timestamp: new Date(),
          });
        } catch (error) {
          captureExceptionRN(error, {
            feature: 'location_update',
            latitude,
            longitude,
            accuracy,
          });
        }
      }
    );

    subscription.then(resolve).catch(reject);
  });
}

/**
 * ==========================================
 * 3. FIRESTORE SERVICE INTEGRATION
 * ==========================================
 */

// Example firestoreService with Sentry integration
import {
  trackFirestoreOperationWeb,
  trackFirestoreOperationRN,
} from '@/src/utils/sentryWeb';
import {
  trackFirestoreOperationRN as trackFBOpRN,
} from '@/src/utils/sentryRN';

// Web version
export async function getUserProfileWeb(userId: string) {
  return trackFirestoreOperationWeb('get', 'users', async () => {
    const docRef = db.collection('users').doc(userId);
    const doc = await docRef.get();
    return doc.data();
  });
}

// Mobile version
export async function getUserProfileMobile(userId: string) {
  return trackFBOpRN('get', 'users', async () => {
    const docRef = db.collection('users').doc(userId);
    const doc = await docRef.get();
    return doc.data();
  });
}

// Create user profile
export async function createUserProfile(userId: string, userData: any) {
  return trackFBOpRN('set', 'users', async () => {
    await db.collection('users').doc(userId).set({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
}

// Update location document
export async function updateLocationDocument(userId: string, location: any) {
  return trackFBOpRN('update', 'locations', async () => {
    await db.collection('locations').doc(userId).update({
      ...location,
      updatedAt: new Date(),
    });
  });
}

// Get emergency contacts
export async function getEmergencyContacts(userId: string) {
  return trackFBOpRN('query', 'emergency_contacts', async () => {
    const querySnapshot = await db
      .collection('emergency_contacts')
      .where('userId', '==', userId)
      .get();

    return querySnapshot.docs.map((doc) => doc.data());
  });
}

/**
 * ==========================================
 * 4. EMERGENCY SOS INTEGRATION
 * ==========================================
 */

import { captureMessageRN, addBreadcrumbRN } from '@/src/utils/sentryRN';

export async function triggerEmergencySOS(userId: string, location: any) {
  try {
    addBreadcrumbRN('SOS triggered', 'emergency', 'warning');

    // Get emergency contacts
    const contacts = await getEmergencyContacts(userId);

    // Create SOS record
    await trackFBOpRN('set', 'sos_alerts', async () => {
      await db.collection('sos_alerts').doc().set({
        userId,
        location,
        contacts: contacts.map((c) => c.contactId),
        status: 'active',
        createdAt: new Date(),
      });
    });

    // Notify contacts (would use notification service)
    for (const contact of contacts) {
      addBreadcrumbRN(
        `Notifying contact: ${contact.name}`,
        'emergency',
        'info'
      );
      // await sendNotification(contact, location);
    }

    captureMessageRN(
      'Emergency SOS triggered',
      'warning',
      {
        userId,
        contactCount: contacts.length,
        latitude: location.latitude,
        longitude: location.longitude,
      }
    );

    return true;
  } catch (error) {
    captureExceptionRN(error, {
      feature: 'emergency_sos',
      userId,
      action: 'trigger_sos',
    });
    throw error;
  }
}

/**
 * ==========================================
 * 5. NOTIFICATION SERVICE INTEGRATION
 * ==========================================
 */

import { addBreadcrumbRN } from '@/src/utils/sentryRN';

export async function sendLocationNotification(contact: any, location: any) {
  try {
    addBreadcrumbRN('Sending location notification', 'notification', 'info');

    const message = {
      notification: {
        title: 'Location Shared',
        body: `Your friend shared their location`,
      },
      data: {
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        userId: contact.userId,
      },
      token: contact.fcmToken,
    };

    const response = await admin.messaging().send(message);

    addBreadcrumbRN(
      `Notification sent: ${response}`,
      'notification',
      'info'
    );

    return response;
  } catch (error) {
    captureExceptionRN(error, {
      feature: 'notification',
      action: 'send_location_notification',
      contactId: contact.id,
    });
    throw error;
  }
}

/**
 * ==========================================
 * 6. WEATHER SERVICE INTEGRATION
 * ==========================================
 */

import { trackNetworkRequest } from '@/src/utils/sentryRN';

export async function fetchWeatherData(latitude: number, longitude: number) {
  return trackNetworkRequest(
    'GET',
    'https://api.openweathermap.org/data/2.5/weather',
    async () => {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.EXPO_PUBLIC_WEATHER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data = await response.json();

      addBreadcrumbRN(
        `Weather fetched: ${data.weather?.[0]?.main || 'unknown'}`,
        'weather',
        'info'
      );

      return data;
    }
  );
}

/**
 * ==========================================
 * 7. MAP SCREEN INTEGRATION
 * ==========================================
 */

// Example MapScreen with Sentry tracking
export function MapScreen() {
  const { location } = useLocation();

  React.useEffect(() => {
    const trackMapRendering = trackFirestoreOperationRN(
      'get',
      'friends_locations',
      async () => {
        // Fetch friend locations
        const docRef = db.collection('friends_locations');
        const snapshot = await docRef.get();
        return snapshot.docs.map((doc) => doc.data());
      }
    );

    trackMapRendering.catch((error) => {
      captureExceptionRN(error, {
        screen: 'MapScreen',
        action: 'fetch_friends_locations',
      });
    });
  }, []);

  return (
    // MapScreen JSX
    <View>
      {/* Map content */}
    </View>
  );
}

/**
 * ==========================================
 * 8. ERROR BOUNDARIES
 * ==========================================
 */

// App.tsx with error boundary
import { withSentryErrorBoundary } from '@/src/utils/sentryRN';

function AppWithErrorBoundary() {
  React.useEffect(() => {
    initializeSentryRN();
  }, []);

  return (
    <AuthProvider>
      <LocationProvider>
        <RootNavigator />
      </LocationProvider>
    </AuthProvider>
  );
}

export default withSentryErrorBoundary(AppWithErrorBoundary, (error) => {
  console.error('App crashed:', error);
  // Optional: trigger recovery UI
});

/**
 * ==========================================
 * 9. CUSTOM HOOKS WITH SENTRY
 * ==========================================
 */

// Custom hook for Firestore queries
function useFirestoreQuery(collectionName: string, query?: any) {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await trackFBOpRN('query', collectionName, async () => {
          const queryRef = db.collection(collectionName);
          const snapshot = await queryRef.get();
          return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        });

        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        captureExceptionRN(err, {
          hook: 'useFirestoreQuery',
          collection: collectionName,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collectionName]);

  return { data, error, loading };
}

/**
 * ==========================================
 * 10. PERFORMANCE MONITORING EXAMPLES
 * ==========================================
 */

// Track complex user flow
async function trackUserJourney(userId: string) {
  const transaction = startTransactionRN('user.journey.login_to_map', 'ui.flow');

  try {
    // Step 1: Fetch user data
    const span1 = transaction?.startChild({
      op: 'db.query',
      description: 'Fetch user profile',
    });
    const userProfile = await getUserProfileMobile(userId);
    span1?.finish('ok');

    // Step 2: Fetch friend locations
    const span2 = transaction?.startChild({
      op: 'db.query',
      description: 'Fetch friend locations',
    });
    const friendLocations = await getEmergencyContacts(userId);
    span2?.finish('ok');

    // Step 3: Initialize location tracking
    const span3 = transaction?.startChild({
      op: 'location.init',
      description: 'Start location tracking',
    });
    await watchLocation();
    span3?.finish('ok');

    transaction?.finish('ok');
    return { userProfile, friendLocations };
  } catch (error) {
    transaction?.finish();
    throw error;
  }
}

export {
  handleLogin,
  handleLogout,
  handleSignup,
  watchLocation,
  getUserProfileWeb,
  getUserProfileMobile,
  triggerEmergencySOS,
  sendLocationNotification,
  fetchWeatherData,
  trackUserJourney,
};

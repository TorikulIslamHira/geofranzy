/**
 * Sentry Quick Reference Guide
 * Common patterns and utility usage
 */

/**
 * ==========================================
 * QUICK START
 * ==========================================
 */

// Web (Next.js)
import { 
  initializeSentryWeb,
  setSentryUserWeb, 
  captureExceptionWeb,
  trackAPICall 
} from '@/src/utils/sentryWeb';

// Mobile (React Native)
import {
  initializeSentryRN,
  setSentryUserRN,
  captureExceptionRN,
  trackLocationUpdate
} from '@/src/utils/sentryRN';

// Backend (Firebase Functions)
import {
  initializeSentryBackend,
  captureExceptionBackend,
  trackFirestoreBackend
} from '@/firebase/functions/src/sentryBackend';

/**
 * ==========================================
 * INITIALIZATION
 * ==========================================
 */

// App.tsx (Mobile)
React.useEffect(() => {
  initializeSentryRN();
}, []);

// layout.tsx (Web)
React.useEffect(() => {
  initializeSentryWeb();
}, []);

// index.ts (Backend)
initializeSentryBackend();

/**
 * ==========================================
 * USER CONTEXT
 * ==========================================
 */

// Set user on login
const handleLogin = async (user) => {
  setSentryUserWeb(user.id, user.email, user.name);
  setSentryUserRN(user.id, user.email, user.name);
};

// Clear user on logout
const handleLogout = () => {
  clearSentryUserWeb();
  clearSentryUserRN();
};

/**
 * ==========================================
 * ERROR HANDLING
 * ==========================================
 */

// Capture exceptions
try {
  await riskyOperation();
} catch (error) {
  // Web
  captureExceptionWeb(error, { context: 'operation_name' });
  
  // Mobile
  captureExceptionRN(error, { context: 'operation_name' });
  
  // Backend
  captureExceptionBackend(error, { operation: 'name' });
}

/**
 * ==========================================
 * TRACKING OPERATIONS
 * ==========================================
 */

// Track API calls (Web)
const data = await trackAPICall('GET', '/api/data', async () => {
  return fetch('/api/data').then(r => r.json());
});

// Track Firestore operations (Mobile)
const user = await trackFirestoreOperationRN('get', 'users', async () => {
  return db.collection('users').doc(userId).get();
});

// Track Firestore operations (Backend)
const users = await trackFirestoreBackend('query', 'users', async () => {
  return admin.firestore().collection('users').get();
});

/**
 * ==========================================
 * BREADCRUMBS (Debug Trail)
 * ==========================================
 */

// Web
import { addBreadcrumbWeb } from '@/src/utils/sentryWeb';
addBreadcrumbWeb('User clicked button', 'ui', 'info');

// Mobile
import { addBreadcrumbRN } from '@/src/utils/sentryRN';
addBreadcrumbRN('Location updated', 'location', 'info');

// Backend
import { addBreadcrumbBackend } from '@/firebase/functions/src/sentryBackend';
addBreadcrumbBackend('Processing user data', 'task', 'info');

/**
 * ==========================================
 * MESSAGES
 * ==========================================
 */

// Capture informational messages
captureMessageWeb('User performed action', 'info');
captureMessageRN('SOS triggered', 'warning');
captureMessageBackend('Daily cleanup started', 'info');

/**
 * ==========================================
 * PERFORMANCE TRACKING
 * ==========================================
 */

// Manual performance monitoring
const transaction = startTransactionWeb('complex-operation', 'ui');
try {
  const span = transaction?.startChild({ op: 'db', description: 'fetch' });
  await fetchData();
  span?.finish('ok');
  transaction?.finish('ok');
} catch (e) {
  transaction?.finish('error');
  throw e;
}

/**
 * ==========================================
 * MOBILE-SPECIFIC
 * ==========================================
 */

// Track location updates
import { trackLocationUpdate } from '@/src/utils/sentryRN';
trackLocationUpdate(latitude, longitude, accuracy);

// With error boundary
import { withSentryErrorBoundary } from '@/src/utils/sentryRN';
export default withSentryErrorBoundary(MyComponent);

/**
 * ==========================================
 * WEB-SPECIFIC
 * ==========================================
 */

// Error boundary component
import { SentryErrorBoundary } from '@/src/utils/sentryWeb';

<SentryErrorBoundary>
  <App />
</SentryErrorBoundary>

// Track user actions
import { trackUserAction } from '@/src/utils/sentryWeb';
trackUserAction('form-submitted', { formId: 'login' });

// Track page views
import { trackPageView } from '@/src/utils/sentryWeb';
trackPageView('/dashboard');

/**
 * ==========================================
 * BACKEND-SPECIFIC
 * ==========================================
 */

// Wrap Cloud Functions
import { createSentryFunction } from '@/firebase/functions/src/sentryBackend';

export const myFunction = functions.https.onCall(
  createSentryFunction('myFunction', async (data, context) => {
    // Function automatically tracked
  })
);

// Set function context
import { setSentryFunctionContext } from '@/firebase/functions/src/sentryBackend';
setSentryFunctionContext('processData', { userId: '123' });

/**
 * ==========================================
 * BEST PRACTICES
 * ==========================================
 */

// DO: Use meaningful context
captureExceptionWeb(error, {
  feature: 'user_auth',
  action: 'login',
  email: email,
  timestamp: new Date().toISOString()
});

// DON'T: Log sensitive data
// captureExceptionWeb(error, {
//   password: userPassword,  // ❌ NEVER
//   token: apiToken,         // ❌ NEVER
//   creditCard: '4111...'    // ❌ NEVER
// });

// DO: Use breadcrumbs for debugging
addBreadcrumbWeb('Database connected', 'db', 'info');
addBreadcrumbWeb('Processing 5000 records', 'task', 'info');

// DON'T: Add breadcrumb for every line
// addBreadcrumbWeb('variable x = 5', 'debug');  // ❌ TOO VERBOSE

// DO: Set user context early
setSentryUserWeb(user.id, user.email, user.name);

// DON'T: Set user context multiple times
// setSentryUserWeb(...); // Once on login
// setSentryUserWeb(...); // Once on page load

/**
 * ==========================================
 * REAL-WORLD EXAMPLES
 * ==========================================
 */

// Example 1: Authentication flow
async function loginUser(email, password) {
  try {
    addBreadcrumbWeb('Starting login', 'auth', 'info');
    
    const user = await auth.signInWithEmailAndPassword(email, password);
    
    setSentryUserWeb(user.uid, email);
    addBreadcrumbWeb('Login successful', 'auth', 'info');
    
    return user;
  } catch (error) {
    addBreadcrumbWeb('Login failed', 'auth', 'error');
    captureExceptionWeb(error, {
      action: 'login',
      email: email
    });
    throw error;
  }
}

// Example 2: Data fetching with tracking
async function fetchUserData(userId) {
  return trackAPICall('GET', `/api/users/${userId}`, async () => {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  });
}

// Example 3: Firestore operation tracking (Mobile)
async function saveUserLocation(location) {
  return trackFirestoreOperationRN('set', 'locations', async () => {
    const userId = getCurrentUserId();
    await db.collection('locations').doc(userId).set({
      ...location,
      timestamp: Date.now()
    });
  });
}

// Example 4: Error handling with context
async function triggerEmergencySOS() {
  try {
    addBreadcrumbRN('SOS triggered', 'emergency', 'warning');
    
    const location = await getCurrentLocation();
    addBreadcrumbRN(`Location: ${location.latitude}, ${location.longitude}`, 'emergency', 'info');
    
    const contacts = await getEmergencyContacts();
    addBreadcrumbRN(`Notifying ${contacts.length} contacts`, 'emergency', 'info');
    
    // Send notifications...
  } catch (error) {
    captureExceptionRN(error, {
      feature: 'emergency_sos',
      action: 'trigger_sos',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// Example 5: Backend Cloud Function
export const processUserData = functions.https.onCall(
  createSentryFunction('processUserData', async (data, context) => {
    const userId = context.auth.uid;
    
    return trackFirestoreBackend('get', 'users', async () => {
      const doc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      return doc.data();
    });
  })
);

/**
 * ==========================================
 * COMMON PATTERNS
 * ==========================================
 */

// Pattern 1: Try-catch with Sentry
try {
  await riskyOperation();
} catch (error) {
  captureExceptionWeb(error, { operation: 'name' });
  throw error; // Re-throw if needed
}

// Pattern 2: Async operation tracking
async function complexOperation() {
  const txn = startTransactionWeb('complex', 'task');
  try {
    // ... operation steps
    txn?.finish('ok');
  } catch (e) {
    txn?.finish('error');
    throw e;
  }
}

// Pattern 3: User action tracking
function handleUserInteraction(action) {
  trackUserAction(action, { timestamp: Date.now() });
  // ... perform action
}

// Pattern 4: Data validation with errors
function validateInput(data) {
  if (!data.email) {
    captureMessageWeb('Invalid email', 'warning', { data });
    throw new Error('Email is required');
  }
}

/**
 * ==========================================
 * DEBUGGING TIPS
 * ==========================================
 */

// Enable detailed logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('Current Sentry transaction:', getCurrentTransactionWeb());
}

// Check if event was sent
Sentry.captureException(error); // Returns event ID

// Test error capture
throw new Error('Test error');

// Monitor in Sentry Dashboard
// 1. Error details page
// 2. Breadcrumb trail
// 3. User context
// 4. Release information

/**
 * ==========================================
 * USEFUL RESOURCES
 * ==========================================
 */

// Documentation:
// - https://docs.sentry.io/
// - https://docs.sentry.io/platforms/javascript/guides/nextjs/
// - https://docs.sentry.io/platforms/react-native/
// - https://docs.sentry.io/platforms/node/guides/gcp-functions/

// Source code:
// - sentryWeb.ts - Web (Next.js) utilities
// - sentryRN.ts - Mobile (React Native) utilities
// - sentryBackend.ts - Backend (Firebase) utilities
// - sentryIntegrationExamples.ts - Practical examples
// - SENTRY_SETUP.md - Detailed setup guide
// - SENTRY_IMPLEMENTATION_GUIDE.md - Complete implementation

/**
 * ==========================================
 * COMMON ERRORS & SOLUTIONS
 * ==========================================
 */

// Error: Sentry DSN not configured
// Solution: Add NEXT_PUBLIC_SENTRY_DSN to .env

// Error: Source maps not working
// Solution: Ensure release version matches and upload maps

// Error: Events not appearing
// Solution: Check DSN, beforeSend filters, and environment

// Error: Too many events
// Solution: Reduce tracesSampleRate or add filters

// Error: Sensitive data in events
// Solution: Use beforeSend hook to filter data

/**
 * ==========================================
 * PRINT THIS GUIDE
 * ==========================================
 * Keep this file open while coding for quick reference
 * All utility functions shown with real usage examples
 */

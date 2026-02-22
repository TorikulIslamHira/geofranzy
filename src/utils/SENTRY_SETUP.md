/**
 * Sentry Configuration Documentation
 * Complete setup and integration guide for error tracking
 */

/**
 * ==========================================
 * 1. ENVIRONMENT SETUP
 * ==========================================
 */

/* 
 * Required environment variables:
 * 
 * .env.local:
 * NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id (web)
 * NEXT_PUBLIC_APP_VERSION=1.0.0
 * 
 * .env.production:
 * NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
 * 
 * Mobile (.env or app.json):
 * EXPO_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-mobile-project-id
 * EXPO_PUBLIC_APP_VERSION=1.0.0
 * 
 * Backend/Firebase Functions:
 * SENTRY_DSN=https://your-key@sentry.io/your-backend-project-id
 */

/**
 * ==========================================
 * 2. NEXT.JS WEB APPLICATION SETUP
 * ==========================================
 */

/* 
 * Install dependencies:
 * npm install @sentry/nextjs @sentry/react
 * 
 * Update next.config.js:
 */

// next.config.js
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  // ... your config
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: false,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: false,
  automaticVercelMonitoring: true,
  automaticVercelWebVitals: true,
});

/* 
 * In your main API route or middleware, initialize:
 * 
 * app/(root)/layout.tsx or _app.tsx:
 */

import { initializeSentryWeb } from '@/src/utils/sentryWeb';
import { SentryErrorBoundary } from '@/src/utils/sentryWeb';

export default function RootLayout({ children }) {
  React.useEffect(() => {
    initializeSentryWeb();
  }, []);

  return (
    <html>
      <body>
        <SentryErrorBoundary>
          {children}
        </SentryErrorBoundary>
      </body>
    </html>
  );
}

/**
 * ==========================================
 * 3. REACT NATIVE MOBILE APP SETUP
 * ==========================================
 */

/*
 * Install dependencies:
 * npx expo install @sentry/react-native expo-build-properties
 * npm install @sentry/react-native
 * 
 * Update app.json:
 */

{
  "plugins": [
    [
      "@sentry/react-native/expo",
      {
        "organization": "your-org",
        "project": "mobile-project",
        "authToken": "sentry-auth-token",
        "url": "https://sentry.io/",
      }
    ]
  ]
}

/*
 * In your App.tsx or main entry point:
 */

import { initializeSentryRN } from '@/src/utils/sentryRN';

export default function App() {
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

/**
 * ==========================================
 * 4. FIREBASE CLOUD FUNCTIONS SETUP
 * ==========================================
 */

/*
 * Install dependencies in firebase/functions:
 * npm install @sentry/node @sentry/tracing
 * 
 * In firebase/functions/src/index.ts:
 */

import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Tracing.Integrations.Http({ tracingOrigins: ['localhost', /^\// ] }),
  ],
  tracesSampleRate: 0.1,
});

// Wrap functions with Sentry
export const myFunction = Sentry.wrap(
  functions.https.onCall(async (data, context) => {
    try {
      // Your function code
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  })
);

/**
 * ==========================================
 * 5. USAGE EXAMPLES
 * ==========================================
 */

/*
 * Web Usage Examples:
 */

import { 
  setSentryUserWeb, 
  captureExceptionWeb, 
  trackAPICall,
  trackUserAction,
  addBreadcrumbWeb 
} from '@/src/utils/sentryWeb';

// Set user context on login
function handleUserLogin(user) {
  setSentryUserWeb(user.id, user.email, user.username);
}

// Capture exceptions
try {
  // some risky code
} catch (error) {
  captureExceptionWeb(error, { 
    context: 'form submission',
    formData: sanitizedData 
  });
}

// Track API calls
async function fetchUserData() {
  return trackAPICall('GET', '/api/user', async () => {
    const response = await fetch('/api/user');
    return response.json();
  });
}

// Track user actions
function handleButtonClick() {
  trackUserAction('user-clicked-submit', { formId: 'login-form' });
}

/*
 * Mobile Usage Examples:
 */

import { 
  setSentryUserRN, 
  captureExceptionRN, 
  trackLocationUpdate,
  trackFirestoreOperationRN,
  addBreadcrumbRN 
} from '@/src/utils/sentryRN';

// Set user context
function handleMobileLogin(user) {
  setSentryUserRN(user.id, user.email, user.username);
}

// Track location updates
function handleLocationUpdate(latitude, longitude, accuracy) {
  trackLocationUpdate(latitude, longitude, accuracy);
}

// Track Firestore operations
async function fetchUserProfile(userId) {
  return trackFirestoreOperationRN(
    'get',
    'users',
    async () => {
      const docRef = db.collection('users').doc(userId);
      return await docRef.get();
    }
  );
}

// Track errors in async operations
async function emergencySOS() {
  try {
    // SOS logic
  } catch (error) {
    captureExceptionRN(error, { 
      feature: 'emergency_sos',
      location: 'active' 
    });
    Alert.alert('Error', 'Failed to send SOS alert');
  }
}

/**
 * ==========================================
 * 6. PERFORMANCE MONITORING
 * ==========================================
 */

/*
 * Automatic performance monitoring:
 * - Web: Next.js integrates Web Vitals, React component renders
 * - Mobile: App startup, screen transitions, location updates
 * - Backend: Function execution time, database queries
 * 
 * Manual performance monitoring:
 */

import { startTransactionWeb, trackAPICall } from '@/src/utils/sentryWeb';

// Complex operation tracking
async function complexDataFetch() {
  const transaction = startTransactionWeb('data-fetch', 'ui.action');
  
  try {
    const span1 = transaction?.startChild({
      op: 'db.query',
      description: 'Fetch users from Firestore'
    });
    const users = await fetchUsers();
    span1?.finish();

    const span2 = transaction?.startChild({
      op: 'data.transform',
      description: 'Transform user data'
    });
    const transformed = transformUsers(users);
    span2?.finish();

    transaction?.finish();
    return transformed;
  } catch (error) {
    transaction?.finish();
    throw error;
  }
}

/**
 * ==========================================
 * 7. RELEASE TRACKING
 * ==========================================
 */

/*
 * Configure release versions for better error grouping:
 * 
 * In package.json:
 */

{
  "version": "1.0.0",
  "env": {
    "NEXT_PUBLIC_APP_VERSION": "1.0.0"
  }
}

/*
 * Create release command for CI/CD:
 */

// Create release script
#!/bin/bash
RELEASE_VERSION="1.0.0"

# Web release
sentry-cli releases -o your-org -p web-project \
  create ${RELEASE_VERSION}

# Mobile release  
sentry-cli releases -o your-org -p mobile-project \
  create ${RELEASE_VERSION}

# Upload sourcemaps
sentry-cli releases -o your-org -p web-project \
  files upload-sourcemaps ./out

/**
 * ==========================================
 * 8. SOURCE MAPS
 * ==========================================
 */

/*
 * Ensure source maps are uploaded for proper error tracking:
 * 
 * Next.js automatically generates source maps
 * Configure sentry-cli in CI/CD to upload them:
 */

// In package.json scripts:
{
  "scripts": {
    "build": "next build",
    "release": "npm run build && sentry-cli releases files upload-sourcemaps ./out"
  }
}

/**
 * ==========================================
 * 9. SECURITY &  PRIVACY
 * ==========================================
 */

/*
 * Best Practices:
 * 
 * 1. Never log sensitive data:
 *    - No passwords, tokens, API keys
 *    - No PII (phone numbers, addresses)
 *    - Use beforeSend hooks to filter data
 * 
 * 2. Use denyURLs to exclude certain requests:
 */

Sentry.init({
  denyURLs: [
    /extensions\//i,
    /^chrome:\/\//i,
    /graph\.windows\.net/i,  // Azure endpoints
  ],
});

/*
 * 3. Replays privacy:
 *    - Enable mask/block for sensitive UI
 *    - Disable in development
 *    - Set lower sample rates for non-error events
 */

new Sentry.Replay({
  maskAllText: true,
  blockAllMedia: true,
  maskAllInputs: true,
});

/**
 * ==========================================
 * 10. ALERTS & INTEGRATIONS
 * ==========================================
 */

/*
 * Configure alerts in Sentry dashboard:
 * 
 * 1. Alert Rules:
 *    - Trigger on first occurrence
 *    - Trigger by count/rate
 *    - Trigger on resolve/regression
 * 
 * 2. Integrations:
 *    - Slack: Post errors to channel
 *    - Discord: Real-time notifications
 *    - GitHub: Create issues on new errors
 *    - PagerDuty: Critical errors alert
 */

/**
 * ==========================================
 * 11. TESTING
 * ==========================================
 */

/*
 * Test error tracking in development:
 */

// In a test component or page
function TestSentryErrors() {
  const testJSError = () => {
    throw new Error('Test JavaScript Error');
  };

  const testAsyncError = async () => {
    Promise.reject(new Error('Test Promise Rejection'));
  };

  const captureTestMessage = () => {
    Sentry.captureMessage('Test message', 'info');
  };

  return (
    <div>
      <button onClick={testJSError}>Test JS Error</button>
      <button onClick={testAsyncError}>Test Async Error</button>
      <button onClick={captureTestMessage}>Capture Message</button>
    </div>
  );
}

/**
 * ==========================================
 * 12. MONITORING DASHBOARDS
 * ==========================================
 */

/*
 * Key metrics to monitor:
 * 
 * 1. Error Rates:
 *    - Critical errors per day
 *    - Error trend analysis
 *    - Affected users count
 * 
 * 2. Performance:
 *    - Page load times
 *    - API response times
 *    - Database query times
 * 
 * 3. User Experience:
 *    - Session replay for user feedback
 *    - Error reproduction capability
 *    - User journey tracking
 * 
 * 4. Releases:
 *    - Error impact by release
 *    - Regression detection
 *    - Health metrics
 */

/**
 * ==========================================
 * 13. HELP & RESOURCES
 * ==========================================
 */

/*
 * Official Documentation:
 * - https://docs.sentry.io/
 * - https://docs.sentry.io/platforms/javascript/guides/nextjs/
 * - https://docs.sentry.io/platforms/react-native/
 * - https://docs.sentry.io/platforms/node/guides/gcp-functions/
 * 
 * Common Issues:
 * - Source maps not uploading: Check auth token and release version
 * - Events not appearing: Check DSN and beforeSend filters
 * - Performance issues: Adjust sample rates (tracesSampleRate)
 * 
 * Contact Support:
 * - support@sentry.io
 * - https://sentry.io/support/
 */

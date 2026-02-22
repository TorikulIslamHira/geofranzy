/**
 * Sentry Implementation Guide for GeoFrenzy
 * Complete setup instructions for all platforms (Web, Mobile, Backend)
 */

// ============================================================
// STEP 1: CREATE SENTRY PROJECTS
// ============================================================

/*
 * 1. Create Sentry account at https://sentry.io
 * 2. Create three projects:
 *    - Web (Next.js)
 *    - Mobile (React Native)
 *    - Backend (Node.js - Cloud Functions)
 * 
 * 3. From each project, note:
 *    - DSN (Data Source Name)
 *    - Organization name
 *    - Project name
 *    - Auth token (for sourcemap uploads)
 * 
 * The DSN looks like:
 * https://<key>@sentry.io/<project-id>
 */

// ============================================================
// STEP 2: MOBILE SETUP (React Native)
// ============================================================

/*
 * A. Install dependencies:
 * 
 * npx expo install @sentry/react-native
 * npx expo install expo-build-properties
 * 
 * B. Update app.json:
 */

{
  "app": {
    "name": "GeoFrenzy",
    "slug": "geofrenzy",
    "version": "1.0.0",
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "organization": "your-sentry-org",
          "project": "mobile-project-name",
          "authToken": "your-sentry-auth-token",
          "url": "https://sentry.io/"
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 21
          }
        }
      ]
    ],
    "plugins": [
      "@react-native-google-signin/google-signin",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow GeoFrenzy to access your location."
        }
      ]
    ]
  }
}

/*
 * C. Create .env file in mobile app root:
 */

EXPO_PUBLIC_SENTRY_DSN=https://your-key@o-xxx.ingest.sentry.io/1234567
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxx

/*
 * D. Initialize Sentry in App.tsx:
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

/*
 * E. Build and test with EAS:
 */

// eas.json additions:
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "preview2": {
      "android": {
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production": {
      "android": {
        "gradleCommand": ":app:bundleRelease"
      },
      "ios": {
        "schemeBuildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {}
  }
}

// ============================================================
// STEP 3: WEB SETUP (Next.js)
// ============================================================

/*
 * A. Install dependencies:
 */

// npm install @sentry/nextjs @sentry/react

/*
 * B. Create .env.local for development:
 */

NEXT_PUBLIC_SENTRY_DSN=https://your-key@o-xxx.ingest.sentry.io/2345678
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=web-project-name
SENTRY_AUTH_TOKEN=your-sentry-auth-token

/*
 * C. Update next.config.js:
 */

const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  reactStrictMode: true,
  // ... other config
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: false,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: false,
  automaticVercelMonitoring: true,
  automaticVercelWebVitals: true,
});

/*
 * D. Create layout wrapper with Sentry:
 */

// app/layout.tsx or _app.tsx
import { initializeSentryWeb, SentryErrorBoundary } from '@/src/utils/sentryWeb';

export default function RootLayout({ children }) {
  React.useEffect(() => {
    initializeSentryWeb();
  }, []);

  return (
    <html>
      <body>
        <SentryErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </SentryErrorBoundary>
      </body>
    </html>
  );
}

// ============================================================
// STEP 4: BACKEND SETUP (Firebase Cloud Functions)
// ============================================================

/*
 * A. Install dependencies in firebase/functions/:
 */

// cd firebase/functions
// npm install @sentry/node @sentry/tracing

/*
 * B. Create .env file in firebase/functions/:
 */

SENTRY_DSN=https://your-key@o-xxx.ingest.sentry.io/3456789
NODE_ENV=production

/*
 * C. Initialize Sentry in firebase/functions/src/index.ts:
 */

import { initializeSentryBackend } from './sentryBackend';

// Initialize at the very top
initializeSentryBackend();

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Now define your functions with Sentry integrated

export const getUserProfile = functions.https.onCall(
  async (data, context) => {
    // Your function code with automatic error tracking
  }
);

// ============================================================
// STEP 5: IMPLEMENTATION CHECKLIST
// ============================================================

// [ ] Create Sentry account
// [ ] Create 3 projects (Web, Mobile, Backend)
// [ ] Get DSNs for each project
// [ ] Generate Sentry Auth Token

// MOBILE:
// [ ] Install @sentry/react-native
// [ ] Update app.json with Sentry plugin
// [ ] Create .env file with EXPO_PUBLIC_SENTRY_DSN
// [ ] Initialize Sentry in App.tsx
// [ ] Set up error boundary with withSentryErrorBoundary

// WEB:
// [ ] Install @sentry/nextjs
// [ ] Create .env.local with NEXT_PUBLIC_SENTRY_DSN
// [ ] Update next.config.js with withSentryConfig
// [ ] Initialize Sentry in root layout
// [ ] Add SentryErrorBoundary to app

// BACKEND:
// [ ] Install @sentry/node
// [ ] Create .env in firebase/functions with SENTRY_DSN
// [ ] Initialize Sentry at top of index.ts
// [ ] Wrap functions with createSentryFunction

// INTEGRATION:
// [ ] Set up user context in AuthContext
// [ ] Add Sentry tracking to Firestore operations
// [ ] Track location updates with trackLocationUpdate
// [ ] Track API calls with trackAPICall

// ============================================================
// STEP 6: TESTING SENTRY
// ============================================================

/*
 * A. Test in Development:
 * Create a test component to verify Sentry is working
 */

function SentryTestComponent() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Sentry Test</h2>
      
      <button onClick={() => {
        throw new Error('Test JS Error');
      }}>
        Test JavaScript Error
      </button>

      <button onClick={() => {
        Promise.reject(new Error('Test Promise Rejection'));
      }}>
        Test Promise Rejection
      </button>

      <button onClick={() => {
        captureMessageWeb('Test message', 'info');
      }}>
        Capture Test Message
      </button>

      <button onClick={() => {
        trackUserAction('button-clicked');
      }}>
        Track User Action
      </button>
    </div>
  );
}

/*
 * B. Build for testing:
 * - Web: npm run build (source maps will be uploaded)
 * - Mobile: eas build -p ios (or -p android)
 * - Backend: firebase deploy --only functions
 */

// ============================================================
// STEP 7: DASHBOARD CONFIGURATION
// ============================================================

/*
 * A. In Sentry Dashboard for each project:
 * 
 * 1. Configure Alerts:
 *    - Critical error threshold (e.g., 10 errors in 1 minute)
 *    - New issue alert
 *    - Regression detection
 * 
 * 2. Set up Integrations:
 *    - Slack: Post errors to #errors channel
 *    - GitHub: Auto-create issues
 *    - Discord: Real-time notifications
 * 
 * 3. Configure Environments:
 *    - Development, staging, production
 *    - Set different alert rules per environment
 * 
 * 4. Release Tracking:
 *    - Set up per-release health metrics
 *    - Track crash-free rate
 */

// ============================================================
// STEP 8: MONITORING STRATEGY
// ============================================================

/*
 * Define what to monitor:
 * 
 * 1. Error Tracking (All Platforms):
 *    - Uncaught errors
 *    - Specific feature errors (auth, location, SOS)
 *    - API/Network errors
 * 
 * 2. Performance (All Platforms):
 *    - Page load times (web)
 *    - App startup time (mobile)
 *    - Function execution time (backend)
 *    - Firestore query latency
 * 
 * 3. User Experience (Mobile):
 *    - Session recording
 *    - Crash rates
 *    - Location accuracy issues
 * 
 * 4. Feature-Specific:
 *    - Emergency SOS success rate
 *    - Location sharing latency
 *    - Friend invitation flow
 *    - Weather data fetch success
 */

// ============================================================
// STEP 9: COMMON INTEGRATION POINTS
// ============================================================

/*
 * Authentication Flow:
 * - Track login/signup/logout
 * - Set user context for all errors
 * - Monitor auth failure rates
 */

/*
 * Location Tracking:
 * - Track location updates
 * - Monitor accuracy issues
 * - Alert on poor GPS signals
 */

/*
 * Emergency SOS:
 * - Track SOS trigger events
 * - Monitor notification delivery
 * - Track response times
 */

/*
 * Firestore Operations:
 * - Monitor query performance
 * - Track write latency
 * - Alert on failed operations
 */

/*
 * API Calls:
 * - Track HTTP requests
 * - Monitor error rates
 * - Track response times
 */

// ============================================================
// STEP 10: BEST PRACTICES
// ============================================================

/*
 * Security:
 * - Never log sensitive data (passwords, tokens, PII)
 * - Use beforeSend to filter sensitive info
 * - Enable replays carefully with data masking
 * 
 * Performance:
 * - Use appropriate sample rates (0.1 = 10%)
 * - Don't track every single event
 * - Use breadcrumbs sparingly
 * 
 * Organization:
 * - Use consistent tag naming
 * - Set meaningful error contexts
 * - Group related errors
 * 
 * Testing:
 * - Test in staging environment first
 * - Verify source maps are uploaded
 * - Check event deduplication
 */

// ============================================================
// STEP 11: MONITORING DASHBOARD EXAMPLES
// ============================================================

/*
 * Key Metrics to Watch:
 * 
 * 1. Error Trends:
 *    - Daily error count
 *    - Affected users
 *    - Error grouping effectiveness
 * 
 * 2. Performance:
 *    - P95 response times
 *    - Crash-free sessions
 *    - Most affected features
 * 
 * 3. Releases:
 *    - Error count per release
 *    - Performance degradation
 *    - User adoption
 * 
 * 4. Custom Metrics:
 *    - Feature-specific error rates
 *    - Geographic error distribution
 *    - Device/OS specific issues
 */

// ============================================================
// STEP 12: TROUBLESHOOTING
// ============================================================

/*
 * Issues and Solutions:
 * 
 * Events not appearing:
 * - Check DSN is correct
 * - Verify beforeSend filter isn't blocking events
 * - Check if environment is development (disabled by default)
 * 
 * Source maps not working:
 * - Ensure release version matches
 * - Upload source maps correctly
 * - Check auth token permissions
 * 
 * High quota usage:
 * - Reduce tracesSampleRate
 * - Filter out irrelevant errors
 * - Use rate limiting
 * 
 * Privacy concerns:
 * - Mask sensitive data in replays
 * - Use beforeSend for filtering
 * - Exclude patterns from monitoring
 */

// ============================================================
// STEP 13: USEFUL COMMANDS
// ============================================================

/*
 * Create release:
 * sentry-cli releases -o org -p project create VERSION
 * 
 * Upload sourcemaps:
 * sentry-cli releases -o org -p project files upload-sourcemaps ./dist
 * 
 * Draft release:
 * sentry-cli releases -o org -p project set-commits VERSION --auto
 * 
 * Finalize release:
 * sentry-cli releases -o org -p project finalize VERSION
 */

// ============================================================
// DONE! 
// ============================================================

/*
 * Your GeoFrenzy app now has comprehensive error tracking across:
 * ✓ Web (Next.js) - sentryWeb.ts
 * ✓ Mobile (React Native) - sentryRN.ts
 * ✓ Backend (Firebase Functions) - sentryBackend.ts
 * 
 * With utilities for:
 * ✓ Error capturing
 * ✓ Performance monitoring
 * ✓ User context tracking
 * ✓ Breadcrumb logging
 * ✓ Custom transactions
 * ✓ Feature-specific monitoring
 * 
 * Integration examples provided in:
 * sentryIntegrationExamples.ts
 * 
 * For more help, see:
 * - SENTRY_SETUP.md
 * - https://docs.sentry.io/
 */

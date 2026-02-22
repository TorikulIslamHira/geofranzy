/**
 * Sentry Implementation Verification Checklist
 * Complete checklist for testing and validating Sentry setup
 */

// ============================================================
// PRE-DEPLOYMENT CHECKLIST
// ============================================================

const DEPLOYMENT_CHECKLIST = {
  // Configuration
  configuration: {
    'Sentry account created': false,
    'Web project (Next.js) created': false,
    'Mobile project (React Native) created': false,  
    'Backend project (Firebase) created': false,
    'DSNs obtained for all projects': false,
    'Auth token generated': false,
  },

  // Environment Variables
  environment: {
    'NEXT_PUBLIC_SENTRY_DSN set (.env.local)': false,
    'EXPO_PUBLIC_SENTRY_DSN set (.env)': false,
    'SENTRY_DSN set (firebase/functions/.env)': false,
    'SENTRY_ORG set in env': false,
    'SENTRY_PROJECT set in env': false,
    'SENTRY_AUTH_TOKEN set in env': false,
  },

  // Dependencies
  dependencies: {
    '@sentry/nextjs installed': false,
    '@sentry/react installed': false,
    '@sentry/react-native installed': false,
    '@sentry/node installed (backend)': false,
    '@sentry/tracing installed (backend)': false,
  },

  // Code Integration
  integration: {
    'initializeSentryWeb() called in app layout': false,
    'initializeSentryRN() called in App.tsx': false,
    'initializeSentryBackend() called in index.ts': false,
    'SentryErrorBoundary wrapped App': false,
    'Error boundary in mobile app': false,
    'next.config.js updated with withSentryConfig': false,
    'app.json updated with Sentry plugin': false,
  },

  // Features
  features: {
    'User context tracking implemented': false,
    'Error capture working': false,
    'Breadcrumb logging working': false,
    'Transaction tracking working': false,
    'Performance monitoring active': false,
  },

  // Testing
  testing: {
    'Test error on web verified in Sentry': false,
    'Test error on mobile verified in Sentry': false,
    'Test error on backend verified in Sentry': false,
    'User context showing in errors': false,
    'Breadcrumbs appear in error details': false,
  },

  // Deployment
  deployment: {
    'Web deployed with source maps uploaded': false,
    'Mobile built with Sentry plugin': false,
    'Backend functions deployed': false,
    'Errors properly grouped in Sentry': false,
  }
};

// ============================================================
// WEB (NEXT.JS) VERIFICATION
// ============================================================

const WEB_VERIFICATION = {
  // Step 1: Verify initialization
  step1: {
    task: 'Verify Sentry initialized on page load',
    checks: [
      'Open browser DevTools',
      'Check console for "Sentry Web initialized"',
      'Verify in Sentry Dashboard > Projects > Web',
    ],
    testCode: `
      // In browser DevTools console
      window.Sentry // Should exist
      window.Sentry.getCurrentHub() // Should return hub
    `,
  },

  // Step 2: Test error capture
  step2: {
    task: 'Test error capture',
    checks: [
      'Create test component with error button',
      'Click button to throw error',
      'Check Sentry dashboard for event',
      'Verify error details, breadcrumbs, user context',
    ],
    testCode: `
      // App.tsx or test page
      function TestErrors() {
        return (
          <div>
            <button onClick={() => {
              throw new Error('Test web error');
            }}>
              Throw Error
            </button>
            <button onClick={() => {
              captureMessageWeb('Test message', 'info');
            }}>
              Send Message
            </button>
          </div>
        );
      }
    `,
  },

  // Step 3: Test source maps
  step3: {
    task: 'Verify source maps uploaded',
    checks: [
      'npm run build',
      'Check Sentry Dashboard > Release',
      'Verify source maps uploaded',
      'Check that errors show source code',
    ],
  },

  // Step 4: Test user context
  step4: {
    task: 'Verify user context tracking',
    checks: [
      'Login user',
      'Trigger error',
      'Check Sentry for user email/ID',
      'Verify breadcrumb trail',
    ],
  },

  // Step 5: Test API tracking
  step5: {
    task: 'Verify API call tracking',
    checks: [
      'Make API call with trackAPICall',
      'Check Sentry performance transactions',
      'Verify response time captured',
    ],
  },
};

// ============================================================
// MOBILE (REACT NATIVE) VERIFICATION
// ============================================================

const MOBILE_VERIFICATION = {
  // Step 1: Verify initialization
  step1: {
    task: 'Verify Sentry initialized on app launch',
    checks: [
      'Run app with expo start',
      'Open Logcat (Android) or Console (iOS)',
      'Look for "Sentry React Native initialized"',
      'Check Sentry Dashboard for session',
    ],
  },

  // Step 2: Test error capture
  step2: {
    task: 'Test error capture',
    checks: [
      'Add test screen with error buttons',
      'Click "Throw Error" button',
      'App should not crash',
      'Check Sentry dashboard for event within 30s',
      'Verify error details, device info',
    ],
    testCode: `
      function TestErrorsScreen() {
        return (
          <View style={{ flex: 1, padding: 20 }}>
            <Button
              title="Test JS Error"
              onPress={() => {
                throw new Error('Test mobile error');
              }}
            />
            <Button
              title="Test Promise Rejection"
              onPress={() => {
                Promise.reject(new Error('Test rejection'));
              }}
            />
            <Button
              title="Capture Message"
              onPress={() => {
                captureMessageRN('Test message', 'info');
              }}
            />
          </View>
        );
      }
    `,
  },

  // Step 3: Test location tracking
  step3: {
    task: 'Verify location tracking',
    checks: [
      'Enable location permissions',
      'Wait for location to update',
      'Check breadcrumbs in Sentry',
      'Verify location coordinates captured',
    ],
  },

  // Step 4: Test Firestore tracking
  step4: {
    task: 'Verify Firestore operation tracking',
    checks: [
      'Perform Firestore query with tracking',
      'Check Sentry performance transactions',
      'Verify query time captured',
    ],
  },

  // Step 5: Test user context
  step5: {
    task: 'Verify user context on mobile',
    checks: [
      'Login user',
      'Trigger error',
      'Check Sentry for user ID/email',
      'Verify breadcrumb trail',
    ],
  },

  // Step 6: Build for production
  step6: {
    task: 'Verify production build',
    checks: [
      'Run: eas build -p ios (or -p android)',
      'Check Sentry for build tracking',
      'Verify source map symbols uploaded',
    ],
  },
};

// ============================================================
// BACKEND (FIREBASE FUNCTIONS) VERIFICATION
// ============================================================

const BACKEND_VERIFICATION = {
  // Step 1: Verify initialization
  step1: {
    task: 'Verify Sentry initialized in functions',
    checks: [
      'Check Firebase functions logs',
      'Look for "Sentry Backend initialized"',
      'Check Sentry Dashboard for backend project',
    ],
  },

  // Step 2: Test error capture
  step2: {
    task: 'Test error in Cloud Function',
    checks: [
      'Call function that throws error',
      'Check Firebase Cloud Functions logs',
      'Verify error appears in Sentry within 10s',
      'Check error details and context',
    ],
    testCode: `
      // Test function that throws
      export const testError = functions.https.onCall(async (data, context) => {
        throw new Error('Test backend error');
      });
      
      // Call from client
      const testError = firebase.functions().httpsCallable('testError');
      testError({}).catch(e => console.log(e));
    `,
  },

  // Step 3: Test Firestore tracking
  step3: {
    task: 'Verify Firestore operation tracking',
    checks: [
      'Execute tracked Firestore operation',
      'Check Sentry performance transactions',
      'Verify operation time captured',
    ],
  },

  // Step 4: Test transactions
  step4: {
    task: 'Verify transaction tracking',
    checks: [
      'Execute function with transaction',
      'Check Sentry for transaction',
      'Verify spans recorded correctly',
    ],
  },

  // Step 5: Deploy and verify
  step5: {
    task: 'Deploy and verify in production',
    checks: [
      'firebase deploy --only functions',
      'Monitor Sentry dashboard',
      'Check for any deployment errors',
    ],
  },
};

// ============================================================
// MONITORING VERIFICATION
// ============================================================

const MONITORING_VERIFICATION = {
  // Dashboard configuration
  dashboard: {
    'Release tracking enabled': false,
    'Alert rules configured': false,
    'Integrations set up (Slack, etc)': false,
    'Environments created (dev, staging, prod)': false,
  },

  // Data verification
  data: {
    'Errors properly grouped': false,
    'Error stats showing': false,
    'Release health tracked': false,
    'Performance metrics visible': false,
    'User sessions tracked': false,
  },

  // Integration verification
  integration: {
    'Web project receiving events': false,
    'Mobile project receiving events': false,
    'Backend project receiving events': false,
    'Source maps resolved correctly': false,
  },
};

// ============================================================
// DETAILED TEST PROCEDURES
// ============================================================

/*
 * TEST 1: WEB ERROR CAPTURE
 * 
 * Steps:
 * 1. Create test page at /test/sentry
 * 2. Add error throwing button
 * 3. Click button
 * 4. Check browser console for errors
 * 5. Wait 10 seconds
 * 6. Refresh Sentry Dashboard
 * 7. Verify event appears
 * 8. Check event details for:
 *    - Error message
 *    - Stack trace
 *    - Breadcrumbs
 *    - Environment
 *    - Release version
 *    - Browser/OS info
 */

/*
 * TEST 2: MOBILE ERROR CAPTURE
 * 
 * Steps:
 * 1. Build app with expo start
 * 2. Create test screen with error button
 * 3. Navigate to test screen
 * 4. Tap error button
 * 5. App should continue running
 * 6. Check Firebase Logcat/Console
 * 7. Wait 30 seconds
 * 8. Check Sentry Dashboard
 * 9. Verify event appears with:
 *    - Device info
 *    - OS version
 *    - App version
 *    - Accuracy of location (if available)
 */

/*
 * TEST 3: USER CONTEXT TRACKING
 * 
 * Steps:
 * 1. Sign out user
 * 2. Trigger error (should have no user context)
 * 3. Check Sentry - no user info
 * 4. Sign in user
 * 5. Trigger error
 * 6. Check Sentry - should show user ID/email
 * 7. Verify user context in breadcrumbs
 * 8. Sign out user
 * 9. Trigger error - user context should be cleared
 */

/*
 * TEST 4: PERFORMANCE MONITORING
 * 
 * Steps:
 * 1. Execute complex operation with transaction
 * 2. Check Sentry > Performance
 * 3. Search for transaction name
 * 4. Verify spans showing
 * 5. Check durations are reasonable
 * 6. Verify response times match operation
 * 7. Check P95/P99 metrics
 */

/*
 * TEST 5: BREADCRUMB TRAIL
 * 
 * Steps:
 * 1. Execute operation with breadcrumbs
 * 2. Trigger error
 * 3. Open error in Sentry
 * 4. Check breadcrumb section
 * 5. Verify breadcrumbs appear in order
 * 6. Check timestamps
 * 7. Verify categories/levels correct
 */

/*
 * TEST 6: SOURCE MAPS
 * 
 * Steps:
 * (Web only)
 * 1. Build web app: npm run build
 * 2. Check Sentry > Release
 * 3. Should see source maps uploaded
 * 4. Trigger error
 * 5. In error stack trace
 * 6. Should show original source code
 * 7. Line numbers should match source
 */

// ============================================================
// VERIFICATION REPORT TEMPLATE
// ============================================================

const VERIFICATION_REPORT = {
  date: new Date().toISOString(),
  
  summary: {
    webStatus: 'PASS/FAIL/PENDING',
    mobileStatus: 'PASS/FAIL/PENDING',
    backendStatus: 'PASS/FAIL/PENDING',
    dashboardStatus: 'PASS/FAIL/PENDING',
  },

  web: {
    initialization: 'PASS/FAIL',
    errorCapture: 'PASS/FAIL',
    sourceMaps: 'PASS/FAIL',
    userContext: 'PASS/FAIL',
    apiTracking: 'PASS/FAIL',
    notes: 'Any issues or observations',
  },

  mobile: {
    initialization: 'PASS/FAIL',
    errorCapture: 'PASS/FAIL',
    locationTracking: 'PASS/FAIL',
    firestoreTracking: 'PASS/FAIL',
    userContext: 'PASS/FAIL',
    buildVerification: 'PASS/FAIL',
    notes: 'Any issues or observations',
  },

  backend: {
    initialization: 'PASS/FAIL',
    errorCapture: 'PASS/FAIL',
    firestoreTracking: 'PASS/FAIL',
    transactions: 'PASS/FAIL',
    deployment: 'PASS/FAIL',
    notes: 'Any issues or observations',
  },

  dashboard: {
    eventsCaptured: 'PASS/FAIL',
    dataGrouping: 'PASS/FAIL',
    alertsConfigured: 'PASS/FAIL',
    integrationsWorking: 'PASS/FAIL',
    notes: 'Any issues or observations',
  },

  issues: [
    // List any issues found
    // - Issue: ...
    //   Solution: ...
  ],

  completionDate: null,
  approvedBy: null,
};

// ============================================================
// TROUBLESHOOTING GUIDE
// ============================================================

const TROUBLESHOOTING = {
  'Events not appearing in Sentry': {
    causes: [
      'DSN not set or incorrect',
      'beforeSend filter blocking events',
      'Environment is development (disabled)',
      'Sentry not initialized',
    ],
    solutions: [
      'Check DSN in env vars',
      'Verify beforeSend hook',
      'Set NODE_ENV=production',
      'Call init function early',
    ],
  },

  'Source maps not working': {
    causes: [
      'Release version mismatch',
      'Source maps not uploaded',
      'Auth token incorrect',
    ],
    solutions: [
      'Ensure release version consistent',
      'Upload source maps via sentry-cli',
      'Check auth token permissions',
    ],
  },

  'High quota usage': {
    causes: [
      'Sample rate too high',
      'Capturing too many transactions',
      'Breadcrumbs created for every action',
    ],
    solutions: [
      'Reduce tracesSampleRate to 0.1',
      'Filter out unnecessary events',
      'Add strategic breadcrumbs only',
    ],
  },

  'Sensitive data in events': {
    causes: [
      'No data filtering',
      'Passwords/tokens logged',
      'PII not masked',
    ],
    solutions: [
      'Use beforeSend to filter data',
      'Never log credentials',
      'Enable data masking in replays',
    ],
  },
};

// ============================================================
// POST-VERIFICATION SIGN-OFF
// ============================================================

/*
 * VERIFICATION COMPLETE CHECKLIST:
 * 
 * [ ] All configuration verified
 * [ ] All dependencies installed
 * [ ] All platforms initialized
 * [ ] Error capture tested (web, mobile, backend)
 * [ ] User context tracking working
 * [ ] Performance monitoring active
 * [ ] Breadcrumbs showing correctly
 * [ ] Source maps uploaded (web)
 * [ ] Alerts configured in Sentry
 * [ ] Integrations set up (Slack, GitHub, etc)
 * [ ] Documentation reviewed
 * [ ] Team trained on Sentry
 * [ ] Production deployment verified
 * 
 * Status: ________________
 * Verified By: ________________
 * Date: ________________
 * 
 * Notes: ________________
 */

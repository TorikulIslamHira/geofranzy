/**
 * Sentry Error Tracking Configuration
 * Central error monitoring for web and mobile apps
 */

import * as Sentry from '@sentry/react';
import { CaptureContext } from '@sentry/types';

const isDevelopment = process.env.NODE_ENV === 'development';
const sentryDSN = process.env.REACT_APP_SENTRY_DSN;

/**
 * Initialize Sentry for error tracking
 */
export function initializeSentry() {
  if (isDevelopment || !sentryDSN) {
    console.log('Sentry disabled in development or unconfigured');
    return;
  }

  Sentry.init({
    dsn: sentryDSN,
    environment: process.env.NODE_ENV,
    release: process.env.REACT_APP_VERSION,
    tracesSampleRate: 0.1, // 10% of transactions
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% on errors
    maxBreadcrumbs: 50,
    maxValueLength: 1024,
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      // Third-party scripts
      /^https:\/\/.*\.ads\.com/i,
    ],
    integrations: [
      // Session Replay: enable after configuring DSN in production
      // Sentry.replayIntegration(),
    ],
  });

  console.log('Sentry initialized for error tracking');
}

/**
 * Set user context for error tracking
 * Call this after user logs in
 */
export function setSentryUser(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context on logout
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, any>
) {
  if (isDevelopment) {
    console.error('Exception:', error, context);
    return;
  }

  const captureContext: CaptureContext = {
    extra: context,
    level: 'error',
  };

  Sentry.captureException(error, captureContext);
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) {
  if (isDevelopment) {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Start performance transaction
 */
export function startTransaction(_name: string, _op: string) {
  // startTransaction removed in Sentry v8; use spans via Sentry.startSpan() instead
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return null as any;
}

/**
 * Breadcrumb tracking
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Error monitoring for API calls
 */
export async function trackApiCall<T>(
  method: string,
  url: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = startTransaction(`api.${method}`, 'http.client');
  const span = transaction?.startChild({
    op: 'http.client',
    description: `${method} ${url}`,
  });

  try {
    addBreadcrumb(`${method} ${url}`, 'api', 'info');
    const result = await fn();
    span?.finish('ok');
    transaction?.finish();
    return result;
  } catch (error) {
    span?.setStatus('error');
    span?.finish();
    transaction?.finish();
    captureException(error, {
      method,
      url,
    });
    throw error;
  }
}

/**
 * Performance monitoring for Firestore operations
 */
export async function trackFirestoreOperation<T>(
  operation: string,
  collection: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = startTransaction(`firestore.${operation}`, 'db.firestore');
  const span = transaction?.startChild({
    op: 'db.firestore',
    description: `${operation} ${collection}`,
  });

  try {
    addBreadcrumb(`Firestore: ${operation} ${collection}`, 'firestore', 'info');
    const result = await fn();
    span?.finish('ok');
    transaction?.finish();
    return result;
  } catch (error) {
    span?.setStatus('error');
    span?.finish();
    transaction?.finish();
    captureException(error, {
      operation,
      collection,
    });
    throw error;
  }
}

/**
 * React Error Boundary wrapper
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  const Wrapped = (props: P) => {
    const FallbackComponent = fallback;
    return (
      <Sentry.ErrorBoundary
        fallback={
          FallbackComponent ? (
            <FallbackComponent error={new Error('Unknown error')} resetError={() => {}} />
          ) : (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h2>Something went wrong</h2>
              <p>Our team has been notified. Please try again later.</p>
            </div>
          )
        }
      >
        <Component {...props} />
      </Sentry.ErrorBoundary>
    );
  };

  return Wrapped;
}

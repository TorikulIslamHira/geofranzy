/**
 * Sentry Error Tracking for Web (Next.js)
 * Browser error monitoring and performance tracking
 */

import * as Sentry from '@sentry/nextjs';

const isDevelopment = process.env.NODE_ENV === 'development';
const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Initialize Sentry for Next.js
 * This should be called at the root of your application
 * 
 * Usage in next.config.js:
 * ```
 * const { withSentryConfig } = require('@sentry/nextjs');
 * module.exports = withSentryConfig(nextConfig, {
 *   org: process.env.SENTRY_ORG,
 *   project: process.env.SENTRY_PROJECT,
 *   silentClientFilesystemErrors: true,
 * });
 * ```
 */
export function initializeSentryWeb() {
  if (isDevelopment || !sentryDSN) {
    console.log('Sentry disabled in development or unconfigured');
    return;
  }

  Sentry.init({
    dsn: sentryDSN,
    environment: isDevelopment ? 'development' : 'production',
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // Filter out non-error exceptions
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Skip certain errors
          if (error.message.includes('ResizeObserver loop limit')) {
            return null;
          }
        }
      }
      return event;
    },
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
      new Sentry.Profiler(),
    ],
  });

  if (!isDevelopment) {
    console.log('Sentry Web initialized');
  }
}

/**
 * Set user context
 */
export function setSentryUserWeb(
  userId: string,
  email?: string,
  username?: string
) {
  Sentry.setUser({
    id: userId,
    email,
    username,
    ip_address: '{{auto}}',
  });
}

/**
 * Clear user context on logout
 */
export function clearSentryUserWeb() {
  Sentry.setUser(null);
}

/**
 * Capture exception with context
 */
export function captureExceptionWeb(
  error: Error | unknown,
  context?: Record<string, any>
) {
  if (isDevelopment) {
    console.error('Exception caught:', error);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message
 */
export function captureMessageWeb(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) {
  if (isDevelopment) {
    console.log(`[${level}] ${message}`);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumbWeb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data: {
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    },
  });
}

/**
 * Start performance transaction
 */
export function startTransactionWeb(name: string, op: string) {
  if (isDevelopment) return null;

  return Sentry.startTransaction({
    name,
    op,
    sampled: true,
  });
}

/**
 * Get current transaction
 */
export function getTransactionWeb() {
  if (isDevelopment) return null;
  return Sentry.getCurrentHub().getActiveTransaction();
}

/**
 * Track API calls
 */
export async function trackAPICall<T>(
  method: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = startTransactionWeb(`http.${method}`, 'http.client');
  const span = transaction?.startChild({
    op: 'http.client',
    description: `${method} ${endpoint}`,
  });

  try {
    addBreadcrumbWeb(`${method} ${endpoint}`, 'http', 'info');
    const result = await fn();
    span?.finish('ok');
    transaction?.finish();
    return result;
  } catch (error) {
    span?.setStatus('error');
    span?.finish();
    transaction?.finish();
    captureExceptionWeb(error, { method, endpoint });
    throw error;
  }
}

/**
 * Track Firestore operations from web
 */
export async function trackFirestoreOperationWeb<T>(
  operation: string,
  collection: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = startTransactionWeb(`fs.${operation}`, 'db');
  const span = transaction?.startChild({
    op: 'db.firestore',
    description: `${operation} on ${collection}`,
  });

  try {
    addBreadcrumbWeb(
      `${operation} on ${collection}`,
      'firestore',
      'info'
    );
    const result = await fn();
    span?.finish('ok');
    transaction?.finish();
    return result;
  } catch (error) {
    span?.setStatus('error');
    span?.finish();
    transaction?.finish();
    captureExceptionWeb(error, { operation, collection });
    throw error;
  }
}

/**
 * Track user actions
 */
export function trackUserAction(
  action: string,
  data?: Record<string, any>
) {
  if (isDevelopment) return;

  addBreadcrumbWeb(
    action,
    'user-action',
    'info'
  );

  Sentry.addBreadcrumb({
    message: action,
    category: 'user-action',
    level: 'info',
    data,
  });
}

/**
 * Track page views
 */
export function trackPageView(page: string) {
  if (isDevelopment) return;

  addBreadcrumbWeb(
    `Page: ${page}`,
    'navigation',
    'info'
  );
}

/**
 * Error Boundary component
 */
export class SentryErrorBoundary extends Sentry.ErrorBoundary {
  constructor(props: any) {
    super(props);
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    super.componentDidCatch(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            Our team has been notified. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#FF6B6B',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for tracking component render performance
 */
export function useSentryPerformance(componentName: string) {
  React.useEffect(() => {
    const transaction = startTransactionWeb(
      `react.${componentName}`,
      'ui.react'
    );
    const span = transaction?.startChild({
      op: 'ui.react.render',
      description: `Render ${componentName}`,
    });

    return () => {
      span?.finish();
      transaction?.finish();
    };
  }, [componentName]);
}

/**
 * Profiling utilities
 */
export const Profiling = {
  /**
   * Start profiling a section of code
   */
  startProfile(name: string) {
    if (isDevelopment) return;
    const transaction = startTransactionWeb(`profile.${name}`, 'profile');
    return transaction;
  },

  /**
   * End profiling
   */
  endProfile(transaction: any) {
    transaction?.finish();
  },
};

// Re-export Sentry for direct use if needed
export { Sentry };

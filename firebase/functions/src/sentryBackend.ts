/**
 * Sentry Configuration for Firebase Cloud Functions
 * Server-side error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
// @sentry/tracing is deprecated in v8; integrations are built into @sentry/node
// import * as Tracing from '@sentry/tracing';

const isDevelopment = process.env.NODE_ENV === 'development';
const sentryDSN = process.env.SENTRY_DSN;

/**
 * Initialize Sentry for Firebase Cloud Functions
 * Call this at the top of your functions/src/index.ts
 */
export function initializeSentryBackend(): void {
  if (!sentryDSN) {
    console.log('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDSN,
    environment: isDevelopment ? 'development' : 'production',
    tracesSampleRate: 0.1,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.onUncaughtExceptionIntegration(),
      Sentry.onUnhandledRejectionIntegration(),
    ],
    beforeSend(event: any, _hint: any) {
      // Filter out health check requests
      if (
        event.request?.url?.includes('/health') ||
        event.request?.url?.includes('/status')
      ) {
        return null;
      }
      return event;
    },
  });

  if (!isDevelopment) {
    console.log('Sentry Backend initialized');
  }
}

/**
 * Set context for function execution
 */
export function setSentryFunctionContext(
  functionName: string,
  data?: Record<string, any>
): void {
  Sentry.setContext('firebaseFunction', {
    functionName,
    ...data,
  });
}

/**
 * Capture backend error
 */
export function captureExceptionBackend(
  error: Error | unknown,
  context?: Record<string, any>
): string {
  if (isDevelopment) {
    console.error('Backend error:', error);
    return '';
  }

  return Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message on backend
 */
export function captureMessageBackend(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): string {
  if (isDevelopment) {
    console.log(`[${level}] ${message}`);
    return '';
  }

  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Add breadcrumb to transaction
 */
export function addBreadcrumbBackend(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a transaction
 */
export function startTransactionBackend(
  _name: string,
  _op: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // startTransaction removed in @sentry/node v8; use Sentry.startSpan() instead
  return undefined;
}

/**
 * Get current transaction
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCurrentTransactionBackend(): any {
  if (isDevelopment) return undefined;
  // getCurrentHub().getActiveTransaction() removed in v8
  return undefined;
}

/**
 * Wrapper for Cloud Functions with automatic error tracking
 */
export function createSentryFunction<T extends any[], R>(
  functionName: string,
  handler: (...args: T) => Promise<R> | R
) {
  return async (...args: T): Promise<R> => {
    const transaction = startTransactionBackend(
      `firebaseFunction.${functionName}`,
      'function'
    );

    try {
      setSentryFunctionContext(functionName, {
        args: args.length,
      });

      addBreadcrumbBackend(
        `Executing ${functionName}`,
        'function',
        'info'
      );

      const result = await handler(...args);

      transaction?.finish('ok');
      return result;
    } catch (error) {
      addBreadcrumbBackend(
        `Error in ${functionName}`,
        'function',
        'error'
      );

      const eventId = captureExceptionBackend(error, {
        functionName,
        argumentCount: args.length,
      });

      transaction?.finish('error');

      throw error;
    }
  };
}

/**
 * Track Firestore operations
 */
export async function trackFirestoreBackend<T>(
  operation: string,
  collection: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = startTransactionBackend(`fs.${operation}`, 'db');
  const span = transaction?.startChild({
    op: 'db.firestore',
    description: `${operation} on ${collection}`,
  });

  try {
    addBreadcrumbBackend(
      `${operation} on ${collection}`,
      'firestore',
      'info'
    );

    const result = await fn();

    span?.finish('ok');
    transaction?.finish('ok');

    return result;
  } catch (error) {
    span?.setStatus('error');
    span?.finish();

    captureExceptionBackend(error, {
      operation,
      collection,
    });

    transaction?.finish('error');

    throw error;
  }
}

/**
 * Track HTTP requests
 */
export async function trackHTTPRequest<T>(
  method: string,
  url: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = startTransactionBackend(
    `http.${method}`,
    'http.client'
  );
  const span = transaction?.startChild({
    op: 'http.client',
    description: `${method} ${url}`,
  });

  try {
    addBreadcrumbBackend(`${method} ${url}`, 'http', 'info');

    const result = await fn();

    span?.finish('ok');
    transaction?.finish('ok');

    return result;
  } catch (error) {
    span?.setStatus('error');
    span?.finish();

    captureExceptionBackend(error, { method, url });

    transaction?.finish('error');

    throw error;
  }
}

/**
 * Middleware for Express/Firebase Functions
 */
export function sentryErrorHandler(
  error: Error,
  req: any,
  res: any,
  next: any
): void {
  const transaction = startTransactionBackend('http.error', 'error');

  addBreadcrumbBackend(
    `${req.method} ${req.url}`,
    'http',
    'error'
  );

  captureExceptionBackend(error, {
    method: req.method,
    url: req.url,
    headers: req.headers,
    statusCode: res.statusCode || 500,
  });

  transaction?.finish('error');

  res.status(500).json({
    error: 'Internal Server Error',
    sentryId: Sentry.captureException(error),
  });
}

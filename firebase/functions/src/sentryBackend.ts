/**
 * Sentry Configuration for Firebase Cloud Functions
 * Server-side error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

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
      new Tracing.Integrations.Http({
        tracingOrigins: [
          'localhost',
          /^\//,
          /^https?:\/\/[^/]*\.firebaseapp\.com/,
        ],
      }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    beforeSend(event, hint) {
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
  name: string,
  op: string
): Sentry.Transaction | undefined {
  if (isDevelopment) return undefined;

  return Sentry.startTransaction({
    name,
    op,
    sampled: true,
  });
}

/**
 * Get current transaction
 */
export function getCurrentTransactionBackend(): Sentry.Transaction | undefined {
  if (isDevelopment) return undefined;
  return Sentry.getCurrentHub().getActiveTransaction();
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

/**
 * Usage Examples
 */

// In firebase/functions/src/index.ts

/*
 * Initialize at startup:
 */
initializeSentryBackend();

/*
 * Use with onCall:
 */
export const getUserProfile = functions.https.onCall(
  createSentryFunction('getUserProfile', async (data, context) => {
    const userId = context.auth?.uid;

    if (!userId) {
      throw new Error('Unauthorized');
    }

    return trackFirestoreBackend('get', 'users', async () => {
      const doc = await admin.firestore().collection('users').doc(userId).get();
      return doc.data();
    });
  })
);

/*
 * Use with onRequest (Express):
 */
export const apiHandler = functions.https.onRequest((req, res) => {
  const transaction = startTransactionBackend(req.url || 'request', 'http');

  try {
    // Handle request
    res.json({ success: true });
    transaction?.finish('ok');
  } catch (error) {
    sentryErrorHandler(error, req, res, null);
  }
});

/*
 * Use with Firestore triggers:
 */
export const onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(
    createSentryFunction('onUserCreated', async (snap, context) => {
      const userId = context.params.userId;
      const userData = snap.data();

      return trackFirestoreBackend('set', 'user_profiles', async () => {
        await admin
          .firestore()
          .collection('user_profiles')
          .doc(userId)
          .set({
            ...userData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      });
    })
  );

/*
 * Use with scheduled functions:
 */
export const dailyCleanup = functions.pubsub
  .schedule('every day 02:00')
  .timeZone('America/New_York')
  .onRun(
    createSentryFunction('dailyCleanup', async (context) => {
      addBreadcrumbBackend(
        'Starting daily cleanup',
        'scheduler',
        'info'
      );

      return trackFirestoreBackend('query', 'stale_data', async () => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);

        const snapshot = await admin
          .firestore()
          .collection('some_collection')
          .where('createdAt', '<', cutoffDate)
          .get();

        const batch = admin.firestore().batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();

        captureMessageBackend(
          `Cleaned up ${snapshot.docs.length} stale documents`,
          'info'
        );
      });
    })
  );

/**
 * Performance Monitoring Example
 */
async function complexDataProcessing(userId: string) {
  const transaction = startTransactionBackend(
    'data.processing',
    'task'
  );

  try {
    // Step 1: Fetch data
    const span1 = transaction?.startChild({
      op: 'db.query',
      description: 'Fetch user data',
    });
    const user = await trackFirestoreBackend('get', 'users', async () => {
      return admin.firestore().collection('users').doc(userId).get();
    });
    span1?.finish('ok');

    // Step 2: Process data
    const span2 = transaction?.startChild({
      op: 'processing',
      description: 'Process data',
    });
    const processed = processData(user.data());
    span2?.finish('ok');

    // Step 3: Save results
    const span3 = transaction?.startChild({
      op: 'db.write',
      description: 'Save processed data',
    });
    await trackFirestoreBackend('update', 'users', async () => {
      await admin
        .firestore()
        .collection('users')
        .doc(userId)
        .update({ processedData: processed });
    });
    span3?.finish('ok');

    transaction?.finish('ok');
  } catch (error) {
    transaction?.finish('error');
    throw error;
  }
}

export {
  initializeSentryBackend,
  setSentryFunctionContext,
  captureExceptionBackend,
  captureMessageBackend,
  addBreadcrumbBackend,
  startTransactionBackend,
  trackFirestoreBackend,
  trackHTTPRequest,
  createSentryFunction,
  complexDataProcessing,
};

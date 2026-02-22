/**
 * Sentry Error Tracking for React Native
 * Mobile app error monitoring and performance tracking
 */

import React from 'react';
import * as Sentry from '@sentry/react-native';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;
const sentryDSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Initialize Sentry for React Native
 * Call this in your app root before rendering
 */
export function initializeSentryRN() {
  if (isDevelopment || !sentryDSN) {
    console.log('Sentry disabled in development or unconfigured');
    return;
  }

  Sentry.init({
    dsn: sentryDSN,
    environment: __DEV__ ? 'development' : 'production',
    release: process.env.EXPO_PUBLIC_APP_VERSION,
    tracesSampleRate: 0.1, // 10% transaction sample rate
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    attachStacktrace: true,
    enableNative: true,
    enableNativeCrashHandling: true,
    maxBreadcrumbs: 50,
    beforeSend(event, hint) {
      // Filter out certain errors
      if (
        event.exception?.values?.[0]?.value?.includes(
          'ANALYTICS_DEBUG_MODE'
        )
      ) {
        return null;
      }
      return event;
    },
    integrations: [
      Sentry.reactNavigationIntegration({
        routeChangeTimeoutMs: 1000,
      }),
    ],
  });

  if (!isDevelopment) {
    console.log('Sentry React Native initialized');
  }
}

/**
 * Initialize React Navigation tracing
 * Call this with your navigation ref
 */
export function initializeNavigationTracing(navigationRef: any) {
  const integration = Sentry.reactNavigationIntegration();
  Sentry.init({
    integrations: [integration],
  });

  return integration;
}

/**
 * Set user context
 */
export function setSentryUserRN(
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
export function clearSentryUserRN() {
  Sentry.setUser(null);
}

/**
 * Capture exception with context
 */
export function captureExceptionRN(
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
export function captureMessageRN(
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
export function addBreadcrumbRN(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data: {
      platform: Platform.OS,
    },
  });
}

/**
 * Start performance transaction
 */
export function startTransactionRN(_name: string, _op: string) {
  // startTransaction was removed in Sentry v5+; return null as no-op
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return null as any;
}

/**
 * Track Firestore operations
 */
export async function trackFirestoreOperationRN<T>(
  operation: string,
  collection: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = startTransactionRN(`fs.${operation}`, 'db');
  const span = transaction?.startChild({
    op: 'db.firestore',
    description: `${operation} on ${collection}`,
  });

  try {
    addBreadcrumbRN(
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
    captureExceptionRN(error, { operation, collection });
    throw error;
  }
}

/**
 * Track location updates
 */
export function trackLocationUpdate(
  latitude: number,
  longitude: number,
  accuracy: number
) {
  if (isDevelopment) return;

  addBreadcrumbRN(
    `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    'location',
    'info'
  );

  if (accuracy > 100) {
    captureMessageRN(
      `Poor location accuracy: ${accuracy.toFixed(0)}m`,
      'warning'
    );
  }
}

/**
 * Track network requests
 */
export async function trackNetworkRequest<T>(
  method: string,
  url: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = startTransactionRN(`http.${method}`, 'http.client');
  const span = transaction?.startChild({
    op: 'http.client',
    description: `${method} ${url}`,
  });

  try {
    addBreadcrumbRN(`${method} ${url}`, 'http', 'info');
    const result = await fn();
    span?.finish('ok');
    transaction?.finish();
    return result;
  } catch (error) {
    span?.setStatus('error');
    span?.finish();
    transaction?.finish();
    captureExceptionRN(error, { method, url });
    throw error;
  }
}

/**
 * Error Boundary HOC
 */
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorHandler?: (error: Error) => void
): React.ComponentType<P> {
  return Sentry.withErrorBoundary(Component, {
    fallback: ({ error, resetError }) => {
      errorHandler?.(error as Error);
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, marginBottom: 16, color: '#666' }}>
            Our team has been notified. Please try again.
          </Text>
          <TouchableOpacity
            onPress={resetError}
            style={{
              backgroundColor: '#FF6B6B',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    },
    showDialog: !isDevelopment,
  });
}

// Re-export Sentry for direct use if needed
export { Sentry };

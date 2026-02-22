/**
 * Error Boundary for Web (React/Next.js)
 * Catches and handles errors in child components
 * Integrates with Sentry for error tracking
 */

'use client';

import React, { ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useThemeStore } from '../stores/themeStore';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
  errorCount: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorId: string | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorCount = this.state.errorCount + 1;

    console.error('[ErrorBoundary] Error caught:', {
      message: error.message,
      count: errorCount,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      error,
      errorInfo: errorInfo.componentStack,
      errorCount,
    });

    // Report to Sentry
    if (Sentry && typeof window !== 'undefined') {
      try {
        this.errorId = Sentry.captureException(error, {
          level: 'error',
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
          tags: {
            'error.boundary': 'web',
            'error.count': errorCount.toString(),
            url: window.location.href,
          },
        });

        console.log('[ErrorBoundary] Error reported to Sentry:', this.errorId);
      } catch (sentryError) {
        console.error('[ErrorBoundary] Sentry error:', sentryError);
      }
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.error('[ErrorBoundary] Custom error handler failed:', handlerError);
      }
    }

    // Warn if multiple errors
    if (errorCount > 3) {
      console.warn('[ErrorBoundary] Multiple errors detected, consider reloading the page');
    }
  }

  private retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private reportError = () => {
    const message = `Error reported with ID: ${this.errorId?.substring(0, 8) || 'unknown'}`;
    console.log('[ErrorBoundary] User reported error:', message);
    alert(message);
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.retry);
      }

      // Default error UI
      return (
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.icon}>❌</div>
            <h1 className={styles.title}>Something Went Wrong</h1>

            <p className={styles.message}>
              An unexpected error occurred. Our team has been notified and is looking into it.
            </p>

            {this.state.error && (
              <div className={styles.errorBox}>
                <p className={styles.errorLabel}>Error:</p>
                <code className={styles.errorText}>{this.state.error.message}</code>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
              <div className={styles.stackView}>
                <p className={styles.stackLabel}>Stack Trace (Dev):</p>
                <pre className={styles.stackText}>{this.state.error.stack}</pre>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <div className={styles.componentView}>
                <p className={styles.componentLabel}>Component Stack (Dev):</p>
                <pre className={styles.componentText}>{this.state.errorInfo}</pre>
              </div>
            )}

            {this.state.errorCount > 1 && (
              <div className={styles.warningBox}>
                <p className={styles.warningText}>
                  ⚠️ This error has occurred {this.state.errorCount} times
                </p>
              </div>
            )}

            {this.errorId && (
              <div className={styles.errorIdBox}>
                <p className={styles.errorIdLabel}>Error ID:</p>
                <code className={styles.errorIdValue}>{this.errorId}</code>
              </div>
            )}

            <div className={styles.buttonContainer}>
              <button
                className={`${styles.button} ${styles.primaryButton}`}
                onClick={this.retry}
              >
                Try Again
              </button>

              <button
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={this.reportError}
              >
                Report Error
              </button>

              <button
                className={`${styles.button} ${styles.tertiaryButton}`}
                onClick={() => (window.location.href = '/')}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

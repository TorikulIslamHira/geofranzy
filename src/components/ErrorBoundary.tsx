/**
 * Error Boundary for React Native
 * Catches and handles errors in child components
 * Integrates with Sentry for error tracking
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Sentry from '@sentry/react-native';
import { Colors } from '../theme/theme';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
  errorCount: number;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
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

  static getDerivedStateFromError(error: Error) {
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

    // Report to Sentry if available
    if (Sentry) {
      try {
        this.errorId = Sentry.captureException(error, {
          level: 'error',
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
          tags: {
            'error.boundary': 'mobile',
            'error.count': errorCount.toString(),
          },
        });
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

    // Show alert if error count exceeds threshold
    if (errorCount > 3) {
      Alert.alert(
        '⚠️ Multiple Errors Detected',
        'The app has encountered multiple errors. Please restart the app.',
        [{ text: 'OK' }]
      );
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
    if (this.errorId) {
      Alert.alert(
        '✓ Error Reported',
        `Error reported with ID: ${this.errorId.substring(0, 8)}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Report Error',
        'Thank you for helping us improve. Error details have been logged.',
        [{ text: 'OK' }]
      );
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.retry);
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <Text style={styles.icon}>❌</Text>
              <Text style={styles.title}>Something Went Wrong</Text>

              <Text style={styles.message}>
                An unexpected error occurred in the app. Our team has been notified.
              </Text>

              {this.state.error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorLabel}>Error:</Text>
                  <Text style={styles.errorText}>{this.state.error.message}</Text>
                </View>
              )}

              {__DEV__ && this.state.error && this.state.error.stack && (
                <View style={styles.stackView}>
                  <Text style={styles.stackLabel}>Stack Trace (Dev):</Text>
                  <Text style={styles.stackText}>{this.state.error.stack}</Text>
                </View>
              )}

              {__DEV__ && this.state.errorInfo && (
                <View style={styles.componentView}>
                  <Text style={styles.componentLabel}>Component Stack (Dev):</Text>
                  <Text style={styles.componentText}>{this.state.errorInfo}</Text>
                </View>
              )}

              {this.state.errorCount > 1 && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ This error has occurred {this.state.errorCount} times
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={this.retry}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={this.reportError}
            >
              <Text style={styles.buttonText}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#856404',
    fontFamily: 'monospace',
  },
  stackView: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  stackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  stackText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
  componentView: {
    width: '100%',
    backgroundColor: '#e7e7e7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  componentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  componentText: {
    fontSize: 10,
    color: '#555',
    fontFamily: 'monospace',
  },
  warningBox: {
    width: '100%',
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  warningText: {
    fontSize: 14,
    color: '#721c24',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ErrorBoundary;

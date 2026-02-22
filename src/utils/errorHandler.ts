/**
 * Error Utilities
 * Centralized error handling, logging, and reporting
 */

import * as Sentry from '@sentry/react-native'; // or '@sentry/nextjs' for web

export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface ErrorContext {
  userId?: string;
  screenName?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: Date;
  context: ErrorContext;
  stack?: string;
}

class ErrorHandler {
  private errorHistory: ErrorReport[] = [];
  private maxHistorySize = 50;

  /**
   * Initialize error handler
   */
  public initialize() {
    if (Sentry) {
      console.log('[ErrorHandler] Sentry initialized');
    }
  }

  /**
   * Log error with context
   */
  public logError(
    error: Error | string,
    context?: ErrorContext,
    severity: ErrorSeverity = ErrorSeverity.ERROR
  ): ErrorReport {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;

    const report: ErrorReport = {
      id: this.generateId(),
      message,
      severity,
      timestamp: new Date(),
      context: context || {},
      stack,
    };

    // Add to history
    this.addToHistory(report);

    // Log to console
    console.error(`[${severity.toUpperCase()}] ${message}`, {
      context,
      stack,
    });

    // Report to Sentry
    if (Sentry) {
      try {
        Sentry.captureException(error instanceof Error ? error : new Error(message), {
          level: severity,
          contexts: {
            custom: context,
          },
          tags: {
            'error.source': 'error-handler',
          },
        });
      } catch (sentryError) {
        console.error('[ErrorHandler] Sentry reporting failed:', sentryError);
      }
    }

    return report;
  }

  /**
   * Log warning
   */
  public logWarning(
    message: string,
    context?: ErrorContext
  ): ErrorReport {
    return this.logError(message, context, ErrorSeverity.WARNING);
  }

  /**
   * Log info
   */
  public logInfo(message: string, context?: ErrorContext): ErrorReport {
    return this.logError(message, context, ErrorSeverity.INFO);
  }

  /**
   * Log debug (dev only)
   */
  public logDebug(message: string, context?: ErrorContext): ErrorReport {
    if (__DEV__) {
      return this.logError(message, context, ErrorSeverity.DEBUG);
    }
    return this.createDummyReport();
  }

  /**
   * Create error boundary context
   */
  public createBoundaryContext(
    componentName: string,
    userId?: string,
    metadata?: Record<string, any>
  ): ErrorContext {
    return {
      screenName: componentName,
      userId,
      metadata,
    };
  }

  /**
   * Handle API error
   */
  public handleApiError(
    error: Error,
    endpoint: string,
    method: string = 'GET',
    statusCode?: number
  ): ErrorReport {
    return this.logError(error, {
      action: `${method} ${endpoint}`,
      metadata: {
        statusCode,
        endpoint,
        method,
      },
    });
  }

  /**
   * Handle network error
   */
  public handleNetworkError(
    error: Error,
    context?: ErrorContext
  ): ErrorReport {
    return this.logError(error, {
      ...context,
      action: 'network_request',
    }, ErrorSeverity.WARNING);
  }

  /**
   * Handle validation error
   */
  public handleValidationError(
    message: string,
    field: string,
    value?: any
  ): ErrorReport {
    return this.logWarning(message, {
      action: 'validation_failed',
      metadata: {
        field,
        value,
      },
    });
  }

  /**
   * Handle permission error
   */
  public handlePermissionError(
    resource: string,
    action: string
  ): ErrorReport {
    return this.logWarning(
      `Permission denied: Cannot ${action} ${resource}`,
      {
        action: 'permission_denied',
        metadata: {
          resource,
          deniedAction: action,
        },
      }
    );
  }

  /**
   * Get error history
   */
  public getErrorHistory(): ErrorReport[] {
    return [...this.errorHistory];
  }

  /**
   * Get recent errors (last N)
   */
  public getRecentErrors(count: number = 10): ErrorReport[] {
    return this.errorHistory.slice(-count);
  }

  /**
   * Get errors by severity
   */
  public getErrorsBySeverity(severity: ErrorSeverity): ErrorReport[] {
    return this.errorHistory.filter((r) => r.severity === severity);
  }

  /**
   * Clear error history
   */
  public clearHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Export error report for debugging
   */
  public exportErrorReport(): string {
    return JSON.stringify(this.errorHistory, null, 2);
  }

  /**
   * Generate unique error ID
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add report to history
   */
  private addToHistory(report: ErrorReport): void {
    this.errorHistory.push(report);

    // Maintain max size
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Create dummy report (for conditional logging)
   */
  private createDummyReport(): ErrorReport {
    return {
      id: '',
      message: '',
      severity: ErrorSeverity.DEBUG,
      timestamp: new Date(),
      context: {},
    };
  }

  /**
   * Get error statistics
   */
  public getStatistics() {
    const stats = {
      total: this.errorHistory.length,
      byLevel: {} as Record<ErrorSeverity, number>,
      recent: this.errorHistory.slice(-5),
    };

    Object.values(ErrorSeverity).forEach((level) => {
      stats.byLevel[level] = this.errorHistory.filter((r) => r.severity === level).length;
    });

    return stats;
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

/**
 * Convenience functions
 */

export function logError(
  error: Error | string,
  context?: ErrorContext
): ErrorReport {
  return errorHandler.logError(error, context);
}

export function logWarning(message: string, context?: ErrorContext): ErrorReport {
  return errorHandler.logWarning(message, context);
}

export function logInfo(message: string, context?: ErrorContext): ErrorReport {
  return errorHandler.logInfo(message, context);
}

export function logDebug(message: string, context?: ErrorContext): ErrorReport {
  return errorHandler.logDebug(message, context);
}

export function handleApiError(
  error: Error,
  endpoint: string,
  method?: string,
  statusCode?: number
): ErrorReport {
  return errorHandler.handleApiError(error, endpoint, method, statusCode);
}

export function handleNetworkError(error: Error, context?: ErrorContext): ErrorReport {
  return errorHandler.handleNetworkError(error, context);
}

export function handleValidationError(
  message: string,
  field: string,
  value?: any
): ErrorReport {
  return errorHandler.handleValidationError(message, field, value);
}

export function handlePermissionError(resource: string, action: string): ErrorReport {
  return errorHandler.handlePermissionError(resource, action);
}

export function getErrorHistory(): ErrorReport[] {
  return errorHandler.getErrorHistory();
}

export function getRecentErrors(count?: number): ErrorReport[] {
  return errorHandler.getRecentErrors(count);
}

export function clearErrorHistory(): void {
  errorHandler.clearHistory();
}

export function exportErrorReport(): string {
  return errorHandler.exportErrorReport();
}

export function getErrorStatistics() {
  return errorHandler.getStatistics();
}

export default errorHandler;

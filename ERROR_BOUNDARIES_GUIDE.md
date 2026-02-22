# Error Boundaries Guide

Complete guide for implementing and using Error Boundaries in GeoFrenzy for graceful error handling and recovery.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Mobile Implementation](#mobile-implementation)
4. [Web Implementation](#web-implementation)
5. [Error Handler Utilities](#error-handler-utilities)
6. [Integration Examples](#integration-examples)
7. [Error Reporting](#error-reporting)
8. [Testing](#testing)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Overview

Error Boundaries are React components that catch JavaScript errors in child components and display a fallback UI instead of crashing the entire app. GeoFrenzy implements error boundaries at multiple levels for comprehensive error handling.

### Key Features

- **Graceful Error Recovery**: Catch errors without crashing the app
- **Sentry Integration**: Automatic error reporting to monitoring service
- **Error History**: Track and analyze errors over time
- **Custom UI**: Display user-friendly error screens
- **Development Tools**: Enhanced debugging in development mode
- **Cross-Platform**: Works on mobile (React Native) and web (React)

## Architecture

```
┌─────────────────────────────────────────┐
│      App Root (Outer Boundary)          │
│  - Catches app-level errors             │
│  - Most severe/critical errors          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Screen/Page Boundaries             │
│  - Catches screen-specific errors       │
│  - Shows screen-level recovery          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   Component/Feature Boundaries          │
│  - Catches component errors             │
│  - Isolated error handling              │
└─────────────────────────────────────────┘
```

### Error Reporting Flow

```
Error in Component
       ↓
Error Boundary catches it
       ↓
Log error locally + context
       ↓
Send to Sentry (if available)
       ↓
Display fallback UI
       ↓
User can retry or navigate away
```

## Mobile Implementation

### Setup Error Boundary in App Root

```typescript
// App.tsx
import ErrorBoundary from './src/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.log('App-level error:', error);
      }}
    >
      {/* Rest of app */}
    </ErrorBoundary>
  );
}
```

### Mobile Error Boundary Component

The mobile error boundary (`src/components/ErrorBoundary.tsx`) provides:

**Props**:
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
```

**Features**:
- Catches React component errors
- Integrates with Sentry for error reporting
- Tracks error count and prevents infinite loops
- Shows dev-friendly stack traces in development
- Provides retry and report buttons
- User-friendly error UI

**Error Tracking**:
- Tracks error count to detect error loops
- Warns users after 3+ errors
- Stores error ID for reference

### Example: Screen-Level Error Boundary

```typescript
// MapScreen.tsx
import ErrorBoundary from '../components/ErrorBoundary';

export function MapScreen() {
  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <View style={styles.container}>
          <Text>Map failed to load</Text>
          <TouchableOpacity onPress={retry}>
            <Text>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    >
      <MapContent />
    </ErrorBoundary>
  );
}
```

## Web Implementation

### Setup Error Boundary in Root Page

```typescript
// web/app/layout.tsx or web/app/page.tsx
import ErrorBoundary from '@/components/ErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.log('App-level error:', error);
          }}
        >
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### Web Error Boundary Component

The web error boundary (`web/src/components/ErrorBoundary.tsx`) provides:

**Features**:
- React/Next.js integrated
- Sentry integration with URL context
- Responsive error UI (desktop + mobile)
- Dark mode support via CSS Media Queries
- Three action buttons (Try Again, Report, Go Home)
- Error ID display for support

**CSS Styling**:
- Modern gradient background
- Responsive design
- Dark/light theme support
- Smooth animations
- Professional appearance

### Example: Page-Level Error Boundary

```typescript
// web/app/dashboard/page.tsx
import ErrorBoundary from '@/components/ErrorBoundary';

export default function DashboardPage() {
  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div>
          <h2>Dashboard Error</h2>
          <p>{error.message}</p>
          <button onClick={retry}>Reload Dashboard</button>
        </div>
      )}
    >
      <DashboardContent />
    </ErrorBoundary>
  );
}
```

## Error Handler Utilities

### Error Handler Class

Centralized error handling for consistent logging and reporting.

```typescript
import { errorHandler, logError, handleApiError } from '@/utils/errorHandler';
```

### Basic Usage

```typescript
// Log error
try {
  await risky_operation();
} catch (error) {
  logError(error, {
    screenName: 'MapScreen',
    action: 'location_update',
  });
}

// Log warning
import { logWarning } from '@/utils/errorHandler';
logWarning('Location permission not granted', {
  screenName: 'LocationScreen',
});

// Log info
import { logInfo } from '@/utils/errorHandler';
logInfo('User logged in', { userId: '123' });
```

### API Error Handling

```typescript
import { handleApiError } from '@/utils/errorHandler';

async function fetchFriends() {
  try {
    const response = await fetch('/api/friends');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    handleApiError(error as Error, '/api/friends', 'GET', 500);
  }
}
```

### Specialized Error Handlers

```typescript
import {
  handleNetworkError,
  handleValidationError,
  handlePermissionError,
} from '@/utils/errorHandler';

// Network error
try {
  await fetch(url);
} catch (error) {
  handleNetworkError(error as Error, {
    screenName: 'MapScreen',
  });
}

// Validation error
if (!email.includes('@')) {
  handleValidationError('Invalid email format', 'email', email);
}

// Permission error
if (!hasLocationPermission) {
  handlePermissionError('Location', 'access');
}
```

## Error Context

Create context for better error tracking:

```typescript
import { errorHandler } from '@/utils/errorHandler';

const context = errorHandler.createBoundaryContext(
  'MapScreen', // Component name
  currentUserId, // User ID
  {
    friendsCount: 10,
    locationsShared: 5,
  }
);

logError(error, context);
```

## Integration Examples

### Example 1: Location Service with Error Boundaries

```typescript
// locationService.ts
import { handleNetworkError } from '@/utils/errorHandler';

export async function getCurrentLocation() {
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { timeout: 10000 }
      );
    });

    return position.coords;
  } catch (error) {
    handleNetworkError(error as Error, {
      action: 'get_current_location',
      screenName: 'MapScreen',
    });
    throw error;
  }
}
```

### Example 2: API Service with Error Boundary

```typescript
// firestoreService.ts
import { handleApiError, logError } from '@/utils/errorHandler';

export async function getFriends(userId: string) {
  try {
    const snapshot = await db.collection('friends')
      .where('userId', '==', userId)
      .get();

    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    handleApiError(error as Error, '/friends', 'GET');
    throw error;
  }
}
```

### Example 3: Component with Try-Catch

```typescript
// ProfileScreen.tsx
import ErrorBoundary from '../components/ErrorBoundary';
import { logWarning } from '@/utils/errorHandler';

function ProfileContent() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (error) {
      logWarning('Failed to load profile', {
        screenName: 'ProfileScreen',
        userId: currentUserId,
      });
    }
  };

  return (
    <ErrorBoundary>
      <ProfileUI profile={profile} />
    </ErrorBoundary>
  );
}
```

## Error Reporting

### Sentry Integration

Errors are automatically reported to Sentry with:

- **Error message and type**
- **Stack trace**
- **Component context**
- **User ID** (if available)
- **URL** (web only)
- **Custom metadata**

### Error History

Track errors locally for debugging:

```typescript
import { getErrorHistory, getRecentErrors, getErrorStatistics } from '@/utils/errorHandler';

// Get all errors
const allErrors = getErrorHistory();

// Get recent 10 errors
const recent = getRecentErrors(10);

// Get statistics
const stats = getErrorStatistics();
console.log(`Total errors: ${stats.total}`);
console.log(`Errors by level:`, stats.byLevel);
```

### Export Error Report

```typescript
import { exportErrorReport } from '@/utils/errorHandler';

const report = exportErrorReport();
console.log(report); // JSON formatted error history
```

## Testing

### Test Error Boundary

```typescript
// ErrorBoundary.test.tsx
import { render } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws error
function BrokenComponent() {
  throw new Error('Test error');
}

it('catches errors and displays fallback UI', () => {
  const { getByText } = render(
    <ErrorBoundary>
      <BrokenComponent />
    </ErrorBoundary>
  );

  expect(getByText('Something Went Wrong')).toBeInTheDocument();
});

it('retries on button click', () => {
  let count = 0;

  function ConditionalError() {
    count++;
    if (count === 1) throw new Error('First attempt');
    return <div>Success</div>;
  }

  const { getByText } = render(
    <ErrorBoundary>
      <ConditionalError />
    </ErrorBoundary>
  );

  const retryButton = getByText('Try Again');
  fireEvent.click(retryButton);

  expect(getByText('Success')).toBeInTheDocument();
});
```

### Test Error Handler

```typescript
// errorHandler.test.ts
import { logError, getRecentErrors, clearErrorHistory } from '@/utils/errorHandler';

beforeEach(() => {
  clearErrorHistory();
});

it('logs errors with context', () => {
  const error = new Error('Test error');
  logError(error, { screenName: 'TestScreen' });

  const history = getRecentErrors(1);
  expect(history[0].message).toBe('Test error');
  expect(history[0].context.screenName).toBe('TestScreen');
});

it('tracks error severity', () => {
  logWarning('Warning message');
  logError('Error message');

  const history = getRecentErrors(2);
  expect(history[0].severity).toBe('warning');
  expect(history[1].severity).toBe('error');
});
```

## Best Practices

### 1. Use Multiple Levels of Boundaries

```typescript
// App level - catches everything
<ErrorBoundary>
  {/* Screen level - catches screen-specific errors */}
  <ErrorBoundary>
    {/* Feature level - catches component errors */}
    <ErrorBoundary>
      <Feature />
    </ErrorBoundary>
  </ErrorBoundary>
</ErrorBoundary>
```

### 2. Provide Meaningful Fallback UI

```typescript
<ErrorBoundary
  fallback={(error, retry) => (
    <View>
      <Text>Unable to load map</Text>
      <Button onPress={retry}>Try Again</Button>
    </View>
  )}
>
  <Map />
</ErrorBoundary>
```

### 3. Always Log Context

```typescript
// Good
logError(error, {
  screenName: 'MapScreen',
  userId: userId,
  action: 'location_update',
  metadata: { friendsCount, locationsShared },
});

// Avoid
logError(error); // Missing context
```

### 4. Handle Specific Errors Differently

```typescript
try {
  await operation();
} catch (error) {
  if (isNetworkError(error)) {
    handleNetworkError(error, { screenName: 'MapScreen' });
  } else if (isValidationError(error)) {
    handleValidationError('Invalid input', 'field');
  } else if (isPermissionError(error)) {
    handlePermissionError('Resource', 'access');
  } else {
    logError(error);
  }
}
```

### 5. Clear Error Boundaries After Navigation

```typescript
// In navigation handler
navigation.navigate('Home');
clearErrorHistory(); // Optional: start fresh on new screen
```

### 6. Don't Catch Everything in Error Boundary

Error boundaries do NOT catch:
- Event handlers (use try-catch)
- Async code (use try-catch)
- Server-side rendering
- Errors in the error boundary itself

```typescript
// Wrong - Error boundary won't catch this
<button onClick={() => throw new Error('Oops')}>Click Me</button>

// Right - Use try-catch in event handler
<button onClick={() => {
  try {
    handleClick();
  } catch (error) {
    logError(error);
  }
}}>
  Click Me
</button>
```

## Troubleshooting

### Error Boundary Not Catching Errors

**Problem**: Error boundary UI not shown

**Solutions**:
1. Ensure error is in render, not event handler
2. Check error boundary is wrapping the component
3. Verify no error in error boundary itself
4. Check React version (must be 16.8+)

**Example**:
```typescript
// Wrong - error in event handler
<button onClick={() => throw new Error()}>Click</button>

// Right - error in render
function Broken() {
  throw new Error('In render');
  return null;
}
```

### Sentry Not Receiving Errors

**Problem**: Errors not appearing in Sentry dashboard

**Solutions**:
1. Verify Sentry is initialized: `Sentry.init()` called
2. Check DSN is correct
3. Verify environment is production or explicitly set
4. Check network connectivity
5. Look for Sentry errors in console

**Debug**:
```typescript
if (Sentry) {
  console.log('Sentry is initialized');
} else {
  console.warn('Sentry not available');
}
```

### Too Many Errors in Development

**Problem**: Error boundaries catching expected errors in dev

**Solution**: Use error boundary only in production, or filter in dev

```typescript
const showErrorBoundary = process.env.NODE_ENV === 'production';

{showErrorBoundary ? (
  <ErrorBoundary><App /></ErrorBoundary>
) : (
  <App />
)}
```

### Error UI Not Resetting

**Problem**: Retry button not fixing error

**Solution**: Ensure component re-mounts on retry, not just re-renders

```typescript
// This doesn't re-mount
const retry = () => setHasError(false);

// This re-mounts
const retry = () => {
  // Reset related state too
  setData(null);
  setHasError(false);
};
```

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready

## File Locations

- **Mobile**: `src/components/ErrorBoundary.tsx`
- **Web**: `web/src/components/ErrorBoundary.tsx`
- **Web CSS**: `web/src/components/ErrorBoundary.module.css`
- **Utilities**: `src/utils/errorHandler.ts`
- **Guide**: `ERROR_BOUNDARIES_GUIDE.md`

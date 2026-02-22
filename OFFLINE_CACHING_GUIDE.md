# Offline Caching Guide

Complete guide for implementing offline caching in GeoFrenzy using IndexedDB, Service Workers, and background sync.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Storage Layer](#storage-layer)
5. [Cache Manager](#cache-manager)
6. [Offline Manager](#offline-manager)
7. [Implementation Examples](#implementation-examples)
8. [Data Sync Strategies](#data-sync-strategies)
9. [Conflict Resolution](#conflict-resolution)
10. [Storage Limits](#storage-limits)
11. [Debugging & Monitoring](#debugging--monitoring)
12. [Best Practices](#best-practices)
13. [Troubleshooting](#troubleshooting)

## Overview

The offline caching system enables GeoFrenzy to function seamlessly without an internet connection. It consists of three layers:

1. **Storage Layer** (`offlineStorage.ts`) - IndexedDB database operations
2. **Cache Manager** (`cacheManager.ts`) - High-level caching API with TTL support
3. **Offline Manager** (`offlineManager.ts`) - Connection detection and sync orchestration

## Architecture

```
┌─────────────────────────────────────────────────┐
│          Application (Screens/Services)         │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│      Offline Manager (Sync Orchestration)       │
│  - Online/offline detection                     │
│  - Retry logic with exponential backoff         │
│  - Pending action coordination                  │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│   Cache Manager (Feature-Specific Caching)      │
│  - User profiles caching                        │
│  - Friends list caching                         │
│  - Location queuing                             │
│  - Message offline delivery                     │
│  - TTL-based expiration                         │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│    Storage Layer (IndexedDB Operations)         │
│  - Object store management                      │
│  - CRUD operations                              │
│  - Index-based queries                          │
│  - Transaction handling                         │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│         IndexedDB + Service Worker              │
│  - Persistent local storage                     │
│  - HTTP response caching                        │
│  - Background sync API                          │
└─────────────────────────────────────────────────┘
```

## Quick Start

### 1. Initialize on App Startup

```typescript
// App.tsx or main entry point
import { initializeCache } from './utils/cacheManager';
import { onOnlineStatusChange } from './utils/offlineManager';

export default function App() {
  useEffect(() => {
    // Initialize cache system
    initializeCache();

    // Listen for online status changes
    const unsubscribe = onOnlineStatusChange(async (online) => {
      console.log('Online status changed:', online);
      if (online) {
        // Sync pending data when back online
        await syncPending();
      }
    });

    return unsubscribe;
  }, []);

  return <AppContent />;
}
```

### 2. Cache User Data

```typescript
import * as cacheManager from './utils/cacheManager';

// When fetching user profile
async function loadUserProfile(userId: string) {
  try {
    // Try to fetch from server
    const response = await fetch(`/api/user/${userId}`);
    const profile = await response.json();

    // Cache for offline access
    await cacheManager.cacheUserProfile(userId, profile);

    return profile;
  } catch (error) {
    // Fall back to cached version
    const cached = await cacheManager.getUserProfile(userId);
    if (cached) {
      console.log('Using cached profile');
      return cached;
    }
    throw error;
  }
}
```

### 3. Queue Actions While Offline

```typescript
import * as cacheManager from './utils/cacheManager';
import { offlineManager } from './utils/offlineManager';

async function sendMessage(conversationId: string, text: string) {
  const message = {
    id: generateId(),
    text,
    senderId: currentUserId,
    timestamp: Date.now(),
  };

  // Cache message
  await cacheManager.cacheMessage(conversationId, message);

  // Try to send if online
  if (offlineManager.getOnlineStatus()) {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ conversationId, message }),
      });
    } catch (error) {
      console.log('Send failed, will retry when online');
    }
  }

  return message;
}
```

## Storage Layer

The storage layer (`offlineStorage.ts`) provides low-level IndexedDB operations.

### Object Stores

```typescript
// Automatically created stores:
- users           // User profile data
- locations       // Location history
- friends         // Friend list cache
- messages        // Message queue
- notifications   // Notification history
- settings        // App settings
- cache           // API response cache
- sync-queue      // Pending actions
```

### Core Functions

```typescript
import * as offlineStorage from './utils/offlineStorage';

// Initialize database
const db = await offlineStorage.getDB();

// Cache data with TTL
await offlineStorage.cacheData('users', 'user-123', userData, 24 * 60 * 60 * 1000);

// Retrieve data
const user = await offlineStorage.getCachedData('users', 'user-123');

// Update existing data
await offlineStorage.updateCachedData('users', 'user-123', updatedData);

// Delete data
await offlineStorage.deleteCachedData('users', 'user-123');

// Get all data from store
const allUsers = await offlineStorage.getAllCachedData('users');

// Queue action for sync
await offlineStorage.queueAction('location-update', { latitude, longitude });

// Get pending actions
const pending = await offlineStorage.getPendingActions();

// Clear entire store
await offlineStorage.clearStore('cache');

// Cleanup old data (older than 7 days)
const deletedCount = await offlineStorage.cleanupOldCache(7);

// Get storage usage info
const info = await offlineStorage.getStorageInfo();

// Export database (debugging)
const data = await offlineStorage.exportDatabase();
```

## Cache Manager

The cache manager (`cacheManager.ts`) provides high-level caching with automatic TTL management.

### Cache Configuration

```typescript
// Built-in TTL settings:
- USER_PROFILE: 24 hours
- FRIENDS_LIST: 6 hours
- LOCATION_DATA: 5 minutes
- EMERGENCY_CONTACTS: 7 days
- API_RESPONSE: 10 minutes
- WEATHER_DATA: 30 minutes
- NOTIFICATIONS: 7 days
```

### User & Profile Management

```typescript
import * as cacheManager from './utils/cacheManager';

// Cache entire user profile
await cacheManager.cacheUserProfile(userId, profileData);

// Retrieve cached profile
const profile = await cacheManager.getUserProfile(userId);
```

### Friends List

```typescript
// Cache friends list
await cacheManager.cacheFriendsList([
  { id: 'friend-1', name: 'Alice', ... },
  { id: 'friend-2', name: 'Bob', ... },
]);

// Get cached friends
const friends = await cacheManager.getFriendsList();
```

### Location Management

```typescript
// Cache location update
await cacheManager.cacheLocationUpdate(userId, {
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: 10,
});

// Get last known location
const location = await cacheManager.getLastKnownLocation(userId);
```

### Message Queue

```typescript
// Queue message for offline delivery
await cacheManager.cacheMessage(conversationId, {
  text: 'Hello!',
  senderId: currentUserId,
  timestamp: Date.now(),
});

// Get messages for conversation
const messages = await cacheManager.getConversationMessages(conversationId);
```

### Emergency Contacts

```typescript
// Cache emergency contacts
await cacheManager.cacheEmergencyContacts([
  { id: 'contact-1', name: 'Mom', phone: '555-1234' },
  { id: 'contact-2', name: 'Dad', phone: '555-5678' },
]);

// Get emergency contacts
const contacts = await cacheManager.getEmergencyContacts();
```

### API Response Caching

```typescript
// Cache with custom TTL
await cacheManager.cacheResponse('/api/weather', weatherData, 'WEATHER_DATA');

// Retrieve cached response
const cached = await cacheManager.getCachedResponse('/api/weather');
```

### Data Synchronization

```typescript
// Sync all pending actions
const result = await cacheManager.syncPendingActions(async (action, data) => {
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      body: JSON.stringify({ action, data }),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
});

// Result: { successful: 5, failed: 0, remaining: 0 }
```

### Cache Statistics & Maintenance

```typescript
// Get cache statistics
const stats = await cacheManager.getCacheStats();
// {
//   usersCount: 10,
//   locationsCount: 50,
//   friendsCount: 25,
//   messagesCount: 100,
//   pendingSyncCount: 3,
//   storageInfo: { usedBytes: 1234567, ... }
// }

// Clear specific cache
await cacheManager.clearCache('locations');

// Cleanup old entries (7+ days)
const deleted = await cacheManager.cleanupCache(7);

// Clear all cache
await cacheManager.clearAllCache();

// Export for debugging
const debug = await cacheManager.exportCacheDebugData();
```

## Offline Manager

The offline manager (`offlineManager.ts`) handles connection detection and sync coordination.

### Connection Detection

```typescript
import { offlineManager, isOnline, onOnlineStatusChange } from './utils/offlineManager';

// Check current status
const online = isOnline();

// Subscribe to changes
const unsubscribe = onOnlineStatusChange((online) => {
  console.log('Connection status:', online ? 'online' : 'offline');
});

// Cleanup
unsubscribe();
```

### Network Information

```typescript
// Get detailed network info
const networkInfo = offlineManager.getNetworkInfo();
// {
//   online: true,
//   type: 'wifi',
//   effectiveType: '4g',
//   downlink: 10,
//   rtt: 50,
//   saveData: false
// }

// Check if slow connection
const isSlow = offlineManager.isSlowConnection();

// Check if should save data
const shouldSave = offlineManager.shouldSaveData();
```

### Retry Logic with Exponential Backoff

```typescript
// Automatic retry with exponential backoff
try {
  const result = await offlineManager.retryWithBackoff(
    'location-update',
    async () => {
      return await fetch('/api/location', { method: 'POST', ... });
    },
    { retryAttempts: 3, retryDelay: 1000, backoffMultiplier: 2 }
  );
} catch (error) {
  console.error('Failed after retries:', error);
}
```

### Execute or Queue

```typescript
// Execute online, queue offline
const result = await offlineManager.executeOrQueue(
  'send-message',
  async () => {
    return await fetch('/api/messages', { method: 'POST', ... });
  },
  async (failedData) => {
    await offlineStorage.queueAction('message-send', failedData);
  }
);
```

### Wait for Online

```typescript
// Wait until device is online with 10-second timeout
try {
  await offlineManager.waitForOnline(10000);
  console.log('Device is online!');
} catch (error) {
  console.log('Timeout waiting for online');
}
```

### Sync Management

```typescript
// Manually trigger sync
await offlineManager.syncPendingData(async (action, data) => {
  // Custom sync implementation
  return await submitAction(action, data);
});

// Get retry statistics
const stats = offlineManager.getRetryStats();
// { queuedActions: 2, actions: [...] }

// Clear retry queue
offlineManager.clearRetryQueue();
```

## Implementation Examples

### Example 1: Location Sharing Feature

```typescript
// MapScreen.tsx
import { offlineManager } from '../utils/offlineManager';
import * as cacheManager from '../utils/cacheManager';

export function MapScreen() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Watch location
    const watch = locationService.watchPosition(async (loc) => {
      setLocation(loc);

      // Cache location for offline access
      await cacheManager.cacheLocationUpdate(currentUserId, loc);

      // Try to update friends if online
      if (offlineManager.getOnlineStatus()) {
        try {
          await fetch('/api/location', {
            method: 'POST',
            body: JSON.stringify(loc),
          });
        } catch (error) {
          // Will retry when back online
          console.log('Location update queued for sync');
        }
      }
    });

    return () => watch.cleanup();
  }, []);

  return (
    <MapView>
      {offlineManager.getOnlineStatus() ? (
        <Badge>LIVE</Badge>
      ) : (
        <Badge>OFFLINE - Updates queued</Badge>
      )}
    </MapView>
  );
}
```

### Example 2: Friends List with Offline Fallback

```typescript
// FriendsScreen.tsx
import * as cacheManager from '../utils/cacheManager';

export function FriendsScreen() {
  const [friends, setFriends] = useState(() => cacheManager.getFriendsList());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadFriends = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/friends');
      const data = await response.json();

      // Cache friends list
      await cacheManager.cacheFriendsList(data);
      setFriends(data);
    } catch (error) {
      // Use cached data
      const cached = await cacheManager.getFriendsList();
      setFriends(cached);
      console.log('Using cached friends list');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  return (
    <FlatList
      data={friends}
      onRefresh={loadFriends}
      refreshing={isRefreshing}
    />
  );
}
```

### Example 3: Message Offline Delivery

```typescript
// ChatScreen.tsx
import * as cacheManager from '../utils/cacheManager';

export function ChatScreen({ conversationId }) {
  const [messages, setMessages] = useState([]);

  const sendMessage = async (text: string) => {
    // Optimistic update with cached message
    const message = {
      id: generateId(),
      text,
      senderId: currentUserId,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, message]);

    // Cache for offline delivery
    await cacheManager.cacheMessage(conversationId, message);

    // Try to send if online
    if (offlineManager.getOnlineStatus()) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          body: JSON.stringify({ conversationId, message }),
        });
        // Mark message as sent
      } catch (error) {
        // Message will sync when online
      }
    }
  };

  return <ChatUI messages={messages} onSend={sendMessage} />;
}
```

### Example 4: Emergency SOS with Queue

```typescript
// SOSScreen.tsx
import * as cacheManager from '../utils/cacheManager';

export async function triggerSOS() {
  const sosData = {
    userId: currentUserId,
    location: await locationService.getCurrentLocation(),
    timestamp: Date.now(),
    emergencyContacts: await cacheManager.getEmergencyContacts(),
  };

  // Queue SOS as critical action
  await offlineStorage.queueAction('sos-trigger', sosData);

  // Try to submit immediately if online
  if (offlineManager.getOnlineStatus()) {
    try {
      await fetch('/api/emergency/sos', {
        method: 'POST',
        body: JSON.stringify(sosData),
      });
    } catch (error) {
      // Will retry when online
    }
  }

  return sosData;
}
```

## Data Sync Strategies

### Network-First Strategy (API Requests)

```typescript
// Try network first, fall back to cache
async function fetchWithCache<T>(
  endpoint: string,
  getCached: () => Promise<T | null>
): Promise<T> {
  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    // Update cache
    await cacheManager.cacheResponse(endpoint, data);
    return data;
  } catch (error) {
    // Fall back to cached version
    const cached = await cacheManager.getCachedResponse(endpoint);
    if (cached) return cached;
    throw error;
  }
}
```

### Cache-First Strategy (Static Assets)

```typescript
// Service Worker: Use cache first, network as fallback
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

### Stale-While-Revalidate

```typescript
// Return cached data immediately, update in background
async function getCachedOrFresh(endpoint: string): Promise<any> {
  const cached = await cacheManager.getCachedResponse(endpoint);

  // Return cached immediately
  if (cached) {
    // Silently update in background
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => cacheManager.cacheResponse(endpoint, data));

    return cached;
  }

  // No cache, fetch fresh
  const response = await fetch(endpoint);
  const data = await response.json();
  await cacheManager.cacheResponse(endpoint, data);
  return data;
}
```

## Conflict Resolution

When offline changes conflict with server updates, use this strategy:

### Last-Write-Wins

```typescript
// Server timestamp takes precedence
async function syncUserProfile(localProfile: any, serverProfile: any) {
  const useLocal =
    (localProfile.lastModified || 0) > (serverProfile.lastModified || 0);

  const merged = useLocal ? localProfile : serverProfile;
  await cacheManager.cacheUserProfile(currentUserId, merged);

  return merged;
}
```

### Application-Specific Logic

```typescript
// For location: newer timestamp wins
async function syncLocation(offline: any, online: any) {
  return offline.timestamp > online.timestamp ? offline : online;
}

// For messages: retry queue until success
async function syncMessages(pendingMessages: any[]) {
  for (const message of pendingMessages) {
    await offlineManager.retryWithBackoff(`msg-${message.id}`, async () => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify(message),
      });
      if (!response.ok) throw new Error('Send failed');
    });
  }
}
```

## Storage Limits

### Quota Management

```typescript
// Check available storage
const info = await offlineStorage.getStorageInfo();
console.log(`Using ${info.percentUsed}% of storage quota`);

// Request persistent storage
if ('storage' in navigator) {
  const isPersistent = await navigator.storage.persist();
  console.log(`Storage persistent: ${isPersistent}`);
}

// Cleanup when approaching limit
if (info.percentUsed > 80) {
  await cacheManager.cleanupCache(3); // Keep 3 days only
}
```

### Database Size Estimates

```
Typical data sizes (compressed):
- User profile: ~2 KB
- Location entry: ~0.5 KB
- Message: ~1 KB
- Friend entry: ~0.5 KB

Estimate 1000 messages: ~50 MB
Storage quota: 50+ MB typical on modern devices
Keep cleanup routine running weekly
```

## Debugging & Monitoring

### Export Database for Analysis

```typescript
// Export entire database for inspection
const dbData = await cacheManager.exportCacheDebugData();
console.log(JSON.stringify(dbData, null, 2));

// Get cache statistics
const stats = await cacheManager.getCacheStats();
console.log('Cache stats:', stats);
```

### Monitor Online Status

```typescript
// Log all online/offline transitions
onOnlineStatusChange((online) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Connection: ${online ? 'ONLINE' : 'OFFLINE'}`);

  if (online) {
    const stats = offlineManager.getRetryStats();
    console.log(`Pending sync actions: ${stats.queuedActions}`);
  }
});
```

### Debug Sync Issues

```typescript
// Get retry statistics
const retryStats = offlineManager.getRetryStats();
console.log('Failed sync attempts:', retryStats.actions);

// Clear and retry
offlineManager.clearRetryQueue();
await offlineManager.syncPendingData();
```

## Best Practices

### 1. Always Cache Critical Data

```typescript
// Always cache after successful fetch
const profile = await fetch('/api/user/me');
await cacheManager.cacheUserProfile(userId, profile);
```

### 2. Set Appropriate TTLs

```typescript
// Short TTL for frequently changing data
await cacheManager.cacheResponse('/api/location', data, 'LOCATION_DATA'); // 5 min

// Long TTL for static data
await cacheManager.cacheResponse('/api/emergency-contacts', contacts, 'EMERGENCY_CONTACTS'); // 7 days
```

### 3. Use Optimistic Updates

```typescript
// Update UI immediately
setMessages([...messages, newMessage]);

// Queue for sync in background
await cacheManager.cacheMessage(conversationId, newMessage);
```

### 4. Handle Sync Completion

```typescript
// Let user know when offline messages sent
onOnlineStatusChange(async (online) => {
  if (online) {
    const result = await cacheManager.syncPendingActions(submitAction);
    if (result.successful > 0) {
      showNotification(`${result.successful} messages sent`);
    }
  }
});
```

### 5. Cleanup Regularly

```typescript
// Weekly cleanup
setInterval(async () => {
  await cacheManager.cleanupCache(7);
}, 7 * 24 * 60 * 60 * 1000);
```

### 6. Test Offline Scenarios

```typescript
// Simulate offline in Chrome DevTools:
// 1. DevTools > Network tab
// 2. Check "Offline" checkbox
// 3. Test app functionality without internet
```

### 7. Monitor Storage Usage

```typescript
// Weekly storage check
setInterval(async () => {
  const stats = await cacheManager.getCacheStats();
  const info = stats.storageInfo;

  if (info.percentUsed > 90) {
    console.warn('Running out of storage!');
    await cacheManager.cleanupCache(3);
  }
}, 7 * 24 * 60 * 60 * 1000);
```

## Troubleshooting

### Issue: Data not persisting

**Solution**: Check IndexedDB error logs

```typescript
try {
  await cacheManager.cacheUserProfile(userId, data);
} catch (error) {
  console.error('[CACHE ERROR]', error);
}
```

### Issue: Sync not triggering

**Solution**: Manually trigger sync when online

```typescript
if (offlineManager.getOnlineStatus()) {
  await offlineManager.syncPendingData();
}
```

### Issue: Storage quota exceeded

**Solution**: Request persistent storage and cleanup

```typescript
if ('storage' in navigator) {
  await navigator.storage.persist();
}
await cacheManager.cleanupCache(3);
```

### Issue: Stale data shown

**Solution**: Reduce TTL or add refresh button

```typescript
// Reduce TTL for weather data
await cacheManager.cacheResponse('/api/weather', data, 'WEATHER_DATA');

// Add manual refresh
<Button onPress={() => loadFreshData()}>Refresh</Button>
```

### Issue: Messages not syncing

**Solution**: Check retry queue and clear if needed

```typescript
const stats = offlineManager.getRetryStats();
console.log('Pending retries:', stats.actions);

// Force retry
offlineManager.clearRetryQueue();
await offlineManager.syncPendingData();
```

---

**Last Updated**: 2024
**Version**: 1.0

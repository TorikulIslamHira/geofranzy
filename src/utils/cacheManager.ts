/**
 * Cache Manager
 * Handles caching strategies for different data types
 */

import * as offlineStorage from './offlineStorage';

/**
 * Cache configuration for different content types
 */
const CACHE_CONFIG = {
  USER_PROFILE: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours
  FRIENDS_LIST: { ttl: 6 * 60 * 60 * 1000 }, // 6 hours
  LOCATION_DATA: { ttl: 5 * 60 * 1000 }, // 5 minutes
  EMERGENCY_CONTACTS: { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
  API_RESPONSE: { ttl: 10 * 60 * 1000 }, // 10 minutes
  WEATHER_DATA: { ttl: 30 * 60 * 1000 }, // 30 minutes
  NOTIFICATIONS: { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
};

/**
 * Cache user profile data
 */
export async function cacheUserProfile(userId: string, profile: any): Promise<void> {
  try {
    await offlineStorage.updateCachedData(
      'users',
      userId,
      profile
    );
  } catch (error) {
    console.error('[CacheManager] Failed to cache user profile:', error);
  }
}

/**
 * Get cached user profile
 */
export async function getUserProfile(userId: string): Promise<any | null> {
  try {
    return await offlineStorage.getCachedData('users', userId);
  } catch (error) {
    console.error('[CacheManager] Failed to get user profile:', error);
    return null;
  }
}

/**
 * Cache friends list
 */
export async function cacheFriendsList(friends: any[]): Promise<void> {
  try {
    await offlineStorage.storeFriendData(friends);
    console.log('[CacheManager] Cached friends list:', friends.length);
  } catch (error) {
    console.error('[CacheManager] Failed to cache friends list:', error);
  }
}

/**
 * Get cached friends list
 */
export async function getFriendsList(): Promise<any[]> {
  try {
    return await offlineStorage.getCachedFriends();
  } catch (error) {
    console.error('[CacheManager] Failed to get friends list:', error);
    return [];
  }
}

/**
 * Cache location update with retry queue
 */
export async function cacheLocationUpdate(
  userId: string,
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }
): Promise<void> {
  try {
    await offlineStorage.storeLocation(userId, {
      ...location,
      timestamp: Date.now(),
    });

    // Queue for background sync
    await offlineStorage.queueAction('location-update', {
      userId,
      location,
      timestamp: Date.now(),
    });

    console.log('[CacheManager] Cached location for offline sync');
  } catch (error) {
    console.error('[CacheManager] Failed to cache location:', error);
  }
}

/**
 * Get last known location from cache
 */
export async function getLastKnownLocation(userId: string): Promise<any | null> {
  try {
    const locations = await offlineStorage.getCachedLocations(userId);
    if (locations.length === 0) return null;

    // Sort by timestamp and get most recent
    return locations.sort(
      (a: any, b: any) => b.timestamp - a.timestamp
    )[0];
  } catch (error) {
    console.error('[CacheManager] Failed to get last known location:', error);
    return null;
  }
}

/**
 * Cache message for offline sending
 */
export async function cacheMessage(
  conversationId: string,
  message: {
    id?: string;
    text: string;
    senderId: string;
    timestamp: number;
  }
): Promise<void> {
  try {
    await offlineStorage.storeMessage(conversationId, {
      ...message,
      offline: true,
    });

    // Queue for sending
    await offlineStorage.queueAction('message-send', {
      conversationId,
      message,
    });

    console.log('[CacheManager] Message queued for offline delivery');
  } catch (error) {
    console.error('[CacheManager] Failed to cache message:', error);
  }
}

/**
 * Get messages for conversation (offline + synced)
 */
export async function getConversationMessages(conversationId: string): Promise<any[]> {
  try {
    return await offlineStorage.getCachedMessages(conversationId);
  } catch (error) {
    console.error('[CacheManager] Failed to get messages:', error);
    return [];
  }
}

/**
 * Cache emergency contacts
 */
export async function cacheEmergencyContacts(contacts: any[]): Promise<void> {
  try {
    await offlineStorage.cacheData(
      'settings',
      'emergency-contacts',
      contacts,
      CACHE_CONFIG.EMERGENCY_CONTACTS.ttl
    );
    console.log('[CacheManager] Cached emergency contacts');
  } catch (error) {
    console.error('[CacheManager] Failed to cache emergency contacts:', error);
  }
}

/**
 * Get emergency contacts
 */
export async function getEmergencyContacts(): Promise<any[]> {
  try {
    const contacts = await offlineStorage.getCachedData('settings', 'emergency-contacts');
    return contacts || [];
  } catch (error) {
    console.error('[CacheManager] Failed to get emergency contacts:', error);
    return [];
  }
}

/**
 * Cache API response with automatic TTL
 */
export async function cacheResponse(
  endpoint: string,
  data: any,
  contentType: keyof typeof CACHE_CONFIG = 'API_RESPONSE'
): Promise<void> {
  try {
    const config = CACHE_CONFIG[contentType];
    await offlineStorage.cacheAPIResponse(endpoint, data, config.ttl);
  } catch (error) {
    console.error('[CacheManager] Failed to cache API response:', error);
  }
}

/**
 * Get cached API response
 */
export async function getCachedResponse(endpoint: string): Promise<any | null> {
  try {
    return await offlineStorage.getCachedAPIResponse(endpoint);
  } catch (error) {
    console.error('[CacheManager] Failed to get cached response:', error);
    return null;
  }
}

/**
 * Cache notification for offline reference
 */
export async function cacheNotification(notification: any): Promise<void> {
  try {
    await offlineStorage.cacheData(
      'notifications',
      `notif-${notification.id}`,
      notification,
      CACHE_CONFIG.NOTIFICATIONS.ttl
    );
  } catch (error) {
    console.error('[CacheManager] Failed to cache notification:', error);
  }
}

/**
 * Get all cached notifications
 */
export async function getCachedNotifications(): Promise<any[]> {
  try {
    return await offlineStorage.getAllCachedData('notifications');
  } catch (error) {
    console.error('[CacheManager] Failed to get cached notifications:', error);
    return [];
  }
}

/**
 * Sync pending actions when online
 */
export async function syncPendingActions(
  onSubmit: (action: string, data: any) => Promise<boolean>
): Promise<{
  successful: number;
  failed: number;
  remaining: number;
}> {
  const results = {
    successful: 0,
    failed: 0,
    remaining: 0,
  };

  try {
    const actions = await offlineStorage.getPendingActions();

    for (const action of actions) {
      try {
        const success = await onSubmit(action.action, action.data);

        if (success) {
          await offlineStorage.removeSyncAction(
            `${action.action}-${action.timestamp}`
          );
          results.successful++;
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error('[CacheManager] Sync action failed:', error);
        results.failed++;
      }
    }

    results.remaining = (await offlineStorage.getPendingActions()).length;

    console.log(
      `[CacheManager] Sync complete - Success: ${results.successful}, Failed: ${results.failed}, Remaining: ${results.remaining}`
    );

    return results;
  } catch (error) {
    console.error('[CacheManager] Sync failed:', error);
    return results;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  usersCount: number;
  locationsCount: number;
  friendsCount: number;
  messagesCount: number;
  pendingSyncCount: number;
  storageInfo: any;
}> {
  try {
    const users = await offlineStorage.getAllCachedData('users');
    const locations = await offlineStorage.getAllCachedData('locations');
    const friends = await offlineStorage.getAllCachedData('friends');
    const messages = await offlineStorage.getAllCachedData('messages');
    const pendingSync = await offlineStorage.getPendingActions();
    const storage = await offlineStorage.getStorageInfo();

    return {
      usersCount: users.length,
      locationsCount: locations.length,
      friendsCount: friends.length,
      messagesCount: messages.length,
      pendingSyncCount: pendingSync.length,
      storageInfo: storage,
    };
  } catch (error) {
    console.error('[CacheManager] Failed to get cache stats:', error);
    return {
      usersCount: 0,
      locationsCount: 0,
      friendsCount: 0,
      messagesCount: 0,
      pendingSyncCount: 0,
      storageInfo: {},
    };
  }
}

/**
 * Clear cache for specific data type
 */
export async function clearCache(
  dataType: 'users' | 'locations' | 'friends' | 'messages' | 'notifications' | 'cache'
): Promise<void> {
  try {
    await offlineStorage.clearStore(dataType);
    console.log(`[CacheManager] Cleared ${dataType} cache`);
  } catch (error) {
    console.error(`[CacheManager] Failed to clear ${dataType} cache:`, error);
  }
}

/**
 * Cleanup old cached data
 */
export async function cleanupCache(ageInDays: number = 7): Promise<number> {
  try {
    const deleted = await offlineStorage.cleanupOldCache(ageInDays);
    console.log(
      `[CacheManager] Cleanup complete - Deleted ${deleted} old entries`
    );
    return deleted;
  } catch (error) {
    console.error('[CacheManager] Cleanup failed:', error);
    return 0;
  }
}

/**
 * Export cache for debugging
 */
export async function exportCacheDebugData(): Promise<any> {
  try {
    return await offlineStorage.exportDatabase();
  } catch (error) {
    console.error('[CacheManager] Failed to export cache:', error);
    return {};
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  try {
    await offlineStorage.clearAllData();
    console.log('[CacheManager] All cache cleared');
  } catch (error) {
    console.error('[CacheManager] Failed to clear all cache:', error);
  }
}

/**
 * Initialize cache on app startup
 */
export async function initializeCache(): Promise<void> {
  try {
    // Initialize IndexedDB
    await offlineStorage.getDB();

    // Cleanup old data
    await cleanupCache(7);

    console.log('[CacheManager] Cache initialized');
  } catch (error) {
    console.error('[CacheManager] Failed to initialize cache:', error);
  }
}

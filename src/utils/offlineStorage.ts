/**
 * IndexedDB Utilities
 * Local data storage for offline access
 *
 * Provides:
 * - User data caching
 * - Location history
 * - Friend data
 * - Message queue
 * - Settings persistence
 */

const DB_NAME = 'geofrenzy-db';
const DB_VERSION = 1;

interface CacheEntry<T> {
  _id?: number;
  id?: string;
  key: string;
  value: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

/**
 * Initialize IndexedDB
 */
export function initializeIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('IndexedDB initialization failed'));
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      const storeNames = [
        'users',
        'locations',
        'friends',
        'messages',
        'notifications',
        'settings',
        'cache',
        'sync-queue',
      ];

      storeNames.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, {
            keyPath: '_id',
            autoIncrement: true,
          });

          // Create indexes
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('key', 'key', { unique: false });

          if (storeName === 'locations') {
            store.createIndex('userId', 'userId', { unique: false });
          }
          if (storeName === 'messages') {
            store.createIndex('conversationId', 'conversationId', {
              unique: false,
            });
          }
        }
      });
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

/**
 * Get IndexedDB instance
 */
let dbInstance: IDBDatabase | null = null;

export async function getDB(): Promise<IDBDatabase> {
  if (!dbInstance) {
    dbInstance = await initializeIndexedDB();
  }
  return dbInstance;
}

/**
 * Save data to IndexedDB
 */
export async function cacheData<T>(
  storeName: string,
  key: string,
  value: T,
  ttl?: number
): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);

  const entry: CacheEntry<T> = {
    key,
    value,
    timestamp: Date.now(),
    ttl,
  };

  return new Promise((resolve, reject) => {
    const request = store.add(entry);

    request.onerror = () => {
      reject(new Error(`Failed to cache data in ${storeName}`));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Retrieve data from IndexedDB
 */
export async function getCachedData<T>(
  storeName: string,
  key: string
): Promise<T | null> {
  const db = await getDB();
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  const index = store.index('key');

  return new Promise((resolve, reject) => {
    const request = index.get(key);

    request.onerror = () => {
      reject(new Error(`Failed to retrieve data from ${storeName}`));
    };

    request.onsuccess = () => {
      const result = (request as IDBRequest).result as CacheEntry<T> | undefined;

      if (!result) {
        resolve(null);
        return;
      }

      // Check if expired
      if (result.ttl && Date.now() - result.timestamp > result.ttl) {
        // Delete expired entry
        const deleteRequest = store.delete(result._id!);
        deleteRequest.onsuccess = () => {
          resolve(null);
        };
        return;
      }

      resolve(result.value);
    };
  });
}

/**
 * Update cached data
 */
export async function updateCachedData<T>(
  storeName: string,
  key: string,
  value: T
): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  const index = store.index('key');

  return new Promise((resolve, reject) => {
    const request = index.get(key);

    request.onerror = () => {
      reject(new Error(`Failed to update data in ${storeName}`));
    };

    request.onsuccess = () => {
      const result = (request as IDBRequest).result;

      if (!result) {
        // Entry doesn't exist, create new one
        cacheData(storeName, key, value).then(resolve).catch(reject);
        return;
      }

      const updated = {
        ...result,
        value,
        timestamp: Date.now(),
      };

      const updateRequest = store.put(updated);
      updateRequest.onsuccess = () => {
        resolve();
      };
    };
  });
}

/**
 * Delete cached data
 */
export async function deleteCachedData(
  storeName: string,
  key: string
): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  const index = store.index('key');

  return new Promise((resolve, reject) => {
    const request = index.get(key);

    request.onerror = () => {
      reject(new Error(`Failed to delete data from ${storeName}`));
    };

    request.onsuccess = () => {
      const result = (request as IDBRequest).result;

      if (!result) {
        resolve();
        return;
      }

      const deleteRequest = store.delete(result._id);
      deleteRequest.onsuccess = () => {
        resolve();
      };
    };
  });
}

/**
 * Clear entire object store
 */
export async function clearStore(storeName: string): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.clear();

    request.onerror = () => {
      reject(new Error(`Failed to clear ${storeName}`));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Get all data from a store
 */
export async function getAllCachedData<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onerror = () => {
      reject(new Error(`Failed to get all data from ${storeName}`));
    };

    request.onsuccess = () => {
      const results = (request as IDBRequest).result as CacheEntry<T>[];
      resolve(results.map((entry) => entry.value));
    };
  });
}

/**
 * Cache API response with structured data
 */
export async function cacheAPIResponse<T>(
  endpoint: string,
  data: T,
  ttl?: number
): Promise<void> {
  return cacheData('cache', endpoint, data, ttl);
}

/**
 * Get cached API response
 */
export async function getCachedAPIResponse<T>(endpoint: string): Promise<T | null> {
  return getCachedData<T>('cache', endpoint);
}

/**
 * Queue action for background sync
 */
export async function queueAction(
  action: 'location-update' | 'message-send' | 'friend-request',
  data: any
): Promise<void> {
  return cacheData('sync-queue', `${action}-${Date.now()}`, {
    action,
    data,
    attempted: 0,
  });
}

/**
 * Get pending sync actions
 */
export async function getPendingActions(): Promise<Array<{
  action: string;
  data: any;
  attempted: number;
}>> {
  const db = await getDB();
  const transaction = db.transaction(['sync-queue'], 'readonly');
  const store = transaction.objectStore('sync-queue');

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onerror = () => {
      reject(new Error('Failed to get pending actions'));
    };

    request.onsuccess = () => {
      const results = (request as IDBRequest).result as Array<CacheEntry<any>>;
      resolve(results.map((entry) => entry.value));
    };
  });
}

/**
 * Remove sync action after successful sync
 */
export async function removeSyncAction(key: string): Promise<void> {
  return deleteCachedData('sync-queue', key);
}

/**
 * Store location for offline access
 */
export async function storeLocation(
  userId: string,
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  }
): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction(['locations'], 'readwrite');
  const store = transaction.objectStore('locations');

  const entry = {
    userId,
    ...location,
    storageTime: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const request = store.add(entry);

    request.onerror = () => {
      reject(new Error('Failed to store location'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Get cached locations for user
 */
export async function getCachedLocations(userId: string) {
  const db = await getDB();
  const transaction = db.transaction(['locations'], 'readonly');
  const store = transaction.objectStore('locations');
  const index = store.index('userId');

  return new Promise((resolve, reject) => {
    const request = index.getAll(userId);

    request.onerror = () => {
      reject(new Error('Failed to get cached locations'));
    };

    request.onsuccess = () => {
      resolve((request as IDBRequest).result);
    };
  });
}

/**
 * Store friend data
 */
export async function storeFriendData(friends: any[]): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction(['friends'], 'readwrite');
  const store = transaction.objectStore('friends');

  // Clear existing
  await clearStore('friends');

  // Add new data
  for (const friend of friends) {
    store.add({
      ...friend,
      cachedAt: Date.now(),
    });
  }
}

/**
 * Get cached friends
 */
export async function getCachedFriends() {
  return getAllCachedData('friends');
}

/**
 * Store message for offline sending
 */
export async function storeMessage(
  conversationId: string,
  message: any
): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction(['messages'], 'readwrite');
  const store = transaction.objectStore('messages');

  return new Promise((resolve, reject) => {
    const request = store.add({
      conversationId,
      ...message,
      offline: true,
      createdAt: Date.now(),
    });

    request.onerror = () => {
      reject(new Error('Failed to store message'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Get cached messages for conversation
 */
export async function getCachedMessages(conversationId: string) {
  const db = await getDB();
  const transaction = db.transaction(['messages'], 'readonly');
  const store = transaction.objectStore('messages');
  const index = store.index('conversationId');

  return new Promise((resolve, reject) => {
    const request = index.getAll(conversationId);

    request.onerror = () => {
      reject(new Error('Failed to get cached messages'));
    };

    request.onsuccess = () => {
      resolve((request as IDBRequest).result);
    };
  });
}

/**
 * Clear old cached data
 * Keep data fresher by removing old entries
 */
export async function cleanupOldCache(ageInDays: number = 7): Promise<number> {
  const db = await getDB();
  const cutoffTime = Date.now() - ageInDays * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  const stores = [
    'locations',
    'messages',
    'notifications',
    'cache',
  ];

  for (const storeName of stores) {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const index = store.index('timestamp');

    const range = IDBKeyRange.upperBound(cutoffTime);
    const request = index.openCursor(range);

    await new Promise<void>((resolve) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  return deletedCount;
}

/**
 * Get database storage information
 */
export async function getStorageInfo(): Promise<{
  usedBytes: number;
  quotaBytes: number;
  percentUsed: number;
}> {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return {
      usedBytes: 0,
      quotaBytes: 0,
      percentUsed: 0,
    };
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      usedBytes: estimate.usage || 0,
      quotaBytes: estimate.quota || 0,
      percentUsed: ((estimate.usage || 0) / (estimate.quota || 1)) * 100,
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return {
      usedBytes: 0,
      quotaBytes: 0,
      percentUsed: 0,
    };
  }
}

/**
 * Export database for debugging
 */
export async function exportDatabase(): Promise<any> {
  const db = await getDB();
  const result: Record<string, any[]> = {};

  const storeNames = Array.from(db.objectStoreNames);

  for (const storeName of storeNames) {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    await new Promise<void>((resolve) => {
      const request = store.getAll();

      request.onsuccess = () => {
        result[storeName] = (request as IDBRequest).result;
        resolve();
      };
    });
  }

  return result;
}

/**
 * Clear all data
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const storeNames = Array.from(db.objectStoreNames);

  for (const storeName of storeNames) {
    await clearStore(storeName);
  }

  console.log('[Cache] All data cleared');
}

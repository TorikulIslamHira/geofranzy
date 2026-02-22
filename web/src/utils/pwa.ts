/**
 * Service Worker Registration & Offline Support
 * Handles PWA registration, offline caching, and background sync
 */

interface RegistrationOptions {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)'){3}$/)
);

export async function registerServiceWorker(options?: RegistrationOptions) {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported in this browser');
    return;
  }

  const publicUrl = new URL(process.env.PUBLIC_URL || '/', window.location.href);
  const swUrl = `${publicUrl.href}service-worker.js`;

  if (publicUrl.origin !== window.location.origin) {
    // Service worker is hosted on a different origin, which might cause CORS issues
    console.warn('Service worker URL is on a different origin');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/',
    });

    console.log('Service Worker registered:', registration);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60000); // Check every minute

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          options?.onUpdate?.(registration);
          console.log('Service Worker updated');
        }
      });
    });

    options?.onSuccess?.(registration);

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    options?.onError?.(error as Error);
  }
}

export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      const success = await registration.unregister();
      if (success) {
        console.log('Service Worker unregistered');
      }
    }
  } catch (error) {
    console.error('Failed to unregister Service Worker:', error);
  }
}

/**
 * Offline Storage using IndexedDB
 * Stores data locally when offline, syncs when online
 */

interface StoredData {
  id: string;
  type: 'location' | 'friend' | 'sos' | 'message';
  data: Record<string, any>;
  timestamp: number;
  synced: boolean;
}

class OfflineStorage {
  private dbName = 'geofrenzy-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('offline-data')) {
          const store = db.createObjectStore('offline-data', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('cache-metadata')) {
          db.createObjectStore('cache-metadata', { keyPath: 'key' });
        }
      };
    });
  }

  async storeData(data: Omit<StoredData, 'timestamp'>): Promise<void> {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction('offline-data', 'readwrite');
    const store = transaction.objectStore('offline-data');

    const storedData: StoredData = {
      ...data,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(storedData);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`Data stored: ${data.type} - ${data.id}`);
        resolve();
      };
    });
  }

  async getUnsyncedData(): Promise<StoredData[]> {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction('offline-data', 'readonly');
    const store = transaction.objectStore('offline-data');
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async markSynced(id: string): Promise<void> {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction('offline-data', 'readwrite');
    const store = transaction.objectStore('offline-data');

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.synced = true;
          store.put(data);
          resolve();
        }
      };
    });
  }

  async clearOldData(olderThan: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction('offline-data', 'readwrite');
    const store = transaction.objectStore('offline-data');

    const cutoffTime = Date.now() - olderThan;

    return new Promise((resolve, reject) => {
      const request = store.openCursor();

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && cursor.value.timestamp < cutoffTime && cursor.value.synced) {
          cursor.delete();
          cursor.continue();
        } else if (cursor) {
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }
}

export const offlineStorage = new OfflineStorage();

/**
 * Background Sync
 */

export async function requestBackgroundSync(tag: string): Promise<void> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log(`Background sync registered: ${tag}`);
    } catch (error) {
      console.error(`Failed to register background sync for ${tag}:`, error);
    }
  }
}

/**
 * Online/Offline Status
 */

export function setupOnlineStatusListener(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  const handleOnline = () => {
    console.log('App is online');
    onOnline();
  };

  const handleOffline = () => {
    console.log('App is offline');
    onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export function isOnline(): boolean {
  return navigator.onLine;
}

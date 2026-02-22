import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import app from '../services/firebase';

/**
 * Initialize Firestore with offline persistence
 * This allows the app to work offline and sync when connection is restored
 */

let firestoreInstance: any = null;

export async function initializeFirestoreWithPersistence() {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  try {
    // Initialize Firestore with default settings
    const db = initializeFirestore(app, {
      // Increase cache size for offline capability (100MB)
      cacheSizeBytes: 100 * 1024 * 1024,
    });

    // Enable offline persistence
    try {
      await enableIndexedDbPersistence(db);
      console.log('Firestore offline persistence enabled');
    } catch (err: any) {
      // Persistence might already be enabled or not supported
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs with Firestore - persistence disabled');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not supported in this browser');
      } else {
        console.error('Failed to enable Firestore persistence:', err);
      }
    }

    firestoreInstance = db;
    return db;
  } catch (error) {
    console.error('Failed to initialize Firestore with persistence:', error);
    throw error;
  }
}

export function getFirestoreInstance() {
  if (!firestoreInstance) {
    throw new Error('Firestore not initialized. Call initializeFirestoreWithPersistence first.');
  }
  return firestoreInstance;
}

/**
 * Offline-first data synchronization
 * Stores pending changes locally and syncs when online
 */

interface PendingChange {
  id: string;
  collection: string;
  operation: 'set' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: number;
}

class OfflineSync {
  private pendingChanges: Map<string, PendingChange> = new Map();
  private storageKey = 'firestore-pending-changes';
  private isOnline = navigator.onLine;

  constructor() {
    this.loadPendingChanges();
    this.setupOnlineListener();
  }

  private loadPendingChanges() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const changes = JSON.parse(stored);
        changes.forEach((change: PendingChange) => {
          this.pendingChanges.set(change.id, change);
        });
        console.log(`Loaded ${changes.length} pending changes`);
      }
    } catch (error) {
      console.error('Failed to load pending changes:', error);
    }
  }

  private savePendingChanges() {
    try {
      const changes = Array.from(this.pendingChanges.values());
      localStorage.setItem(this.storageKey, JSON.stringify(changes));
    } catch (error) {
      console.error('Failed to save pending changes:', error);
    }
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('App is online - syncing pending changes');
      this.isOnline = true;
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      console.log('App is offline - queuing changes');
      this.isOnline = false;
    });
  }

  addPendingChange(
    collection: string,
    docId: string,
    operation: 'set' | 'update' | 'delete',
    data: Record<string, any> = {}
  ) {
    const changeId = `${collection}-${docId}`;
    const change: PendingChange = {
      id: changeId,
      collection,
      operation,
      data,
      timestamp: Date.now(),
    };

    this.pendingChanges.set(changeId, change);
    this.savePendingChanges();

    console.log(`Queued ${operation} on ${collection}/${docId}`);
  }

  removePendingChange(collection: string, docId: string) {
    const changeId = `${collection}-${docId}`;
    this.pendingChanges.delete(changeId);
    this.savePendingChanges();
  }

  getPendingChanges(): PendingChange[] {
    return Array.from(this.pendingChanges.values());
  }

  async syncPendingChanges() {
    if (!this.isOnline) {
      console.log('Still offline - skipping sync');
      return;
    }

    const changes = this.getPendingChanges();
    if (changes.length === 0) {
      return;
    }

    console.log(`Syncing ${changes.length} pending changes...`);

    for (const change of changes) {
      try {
        // Network request to sync with server
        // This would be handled by your backend API
        const response = await fetch('/api/firestore/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(change),
        });

        if (response.ok) {
          this.removePendingChange(change.collection, change.id);
          console.log(`Synced: ${change.id}`);
        } else {
          console.error(`Failed to sync: ${change.id}`, response.statusText);
        }
      } catch (error) {
        console.error(`Error syncing ${change.id}:`, error);
        // Keep the change for retry on next online
      }
    }
  }

  clearAllPendingChanges() {
    this.pendingChanges.clear();
    localStorage.removeItem(this.storageKey);
    console.log('Cleared all pending changes');
  }
}

export const offlineSync = new OfflineSync();

/**
 * Cache Management
 */

export interface CacheMetadata {
  key: string;
  lastUpdated: number;
  expiresAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class CacheManager {
  private caches: Map<string, { data: any; expiresAt: number }> = new Map();

  set(key: string, data: any, duration: number = CACHE_DURATION) {
    this.caches.set(key, {
      data,
      expiresAt: Date.now() + duration,
    });
  }

  get(key: string) {
    const cached = this.caches.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.caches.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(key?: string) {
    if (key) {
      this.caches.delete(key);
    } else {
      this.caches.clear();
    }
  }

  isExpired(key: string): boolean {
    const cached = this.caches.get(key);
    if (!cached) return true;
    return Date.now() > cached.expiresAt;
  }
}

export const cacheManager = new CacheManager();

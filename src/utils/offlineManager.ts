/**
 * Offline Manager
 * Handles offline detection, background sync, and connection management
 */

import * as cacheManager from './cacheManager';

interface SyncConfig {
  retryAttempts: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  retryAttempts: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
};

class OfflineManager {
  private isOnline = typeof navigator !== 'undefined' && navigator.onLine;
  private listeners: Set<(online: boolean) => void> = new Set();
  private syncSubscription: (() => void) | null = null;
  private syncInProgress = false;
  private retryQueue: Map<string, { attempts: number; lastAttempt: number }> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  /**
   * Check if device is online
   */
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Subscribe to online/offline changes
   */
  public subscribe(listener: (online: boolean) => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('[OfflineManager] Device is online');
    this.isOnline = true;
    this.notifyListeners();
    this.syncPendingData();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('[OfflineManager] Device is offline');
    this.isOnline = false;
    this.notifyListeners();
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isOnline);
      } catch (error) {
        console.error('[OfflineManager] Error in listener:', error);
      }
    });
  }

  /**
   * Sync pending data when online
   */
  public async syncPendingData(
    onSubmit?: (action: string, data: any) => Promise<boolean>
  ): Promise<void> {
    if (this.syncInProgress) {
      console.log('[OfflineManager] Sync already in progress');
      return;
    }

    if (!this.isOnline) {
      console.log('[OfflineManager] Cannot sync - device is offline');
      return;
    }

    this.syncInProgress = true;

    try {
      if (onSubmit) {
        const result = await cacheManager.syncPendingActions(onSubmit);
        console.log('[OfflineManager] Sync complete:', result);
      } else {
        console.log('[OfflineManager] No sync callback provided');
      }
    } catch (error) {
      console.error('[OfflineManager] Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Retry action with exponential backoff
   */
  public async retryWithBackoff<T>(
    key: string,
    fn: () => Promise<T>,
    config: Partial<SyncConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_SYNC_CONFIG, ...config };
    const retryData = this.retryQueue.get(key) || { attempts: 0, lastAttempt: 0 };

    if (retryData.attempts >= finalConfig.retryAttempts) {
      throw new Error(
        `Max retry attempts (${finalConfig.retryAttempts}) exceeded for ${key}`
      );
    }

    // Check if enough time has passed since last attempt
    const delayMs =
      finalConfig.retryDelay * Math.pow(finalConfig.backoffMultiplier, retryData.attempts);
    const timeSinceLastAttempt = Date.now() - retryData.lastAttempt;

    if (timeSinceLastAttempt < delayMs) {
      await new Promise((resolve) => setTimeout(resolve, delayMs - timeSinceLastAttempt));
    }

    try {
      const result = await fn();
      this.retryQueue.delete(key);
      return result;
    } catch (error) {
      retryData.attempts++;
      retryData.lastAttempt = Date.now();
      this.retryQueue.set(key, retryData);

      console.error(
        `[OfflineManager] Attempt ${retryData.attempts}/${finalConfig.retryAttempts} failed for ${key}:`,
        error
      );

      if (retryData.attempts < finalConfig.retryAttempts) {
        return this.retryWithBackoff(key, fn, config);
      }

      throw error;
    }
  }

  /**
   * Execute function only if online, otherwise queue
   */
  public async executeOrQueue<T>(
    key: string,
    fn: () => Promise<T>,
    queueFn?: (data: any) => Promise<void>
  ): Promise<T | null> {
    if (this.isOnline) {
      try {
        return await fn();
      } catch (error) {
        console.error('[OfflineManager] Online execution failed:', error);
        // Fall through to queue if online execution fails
      }
    }

    // Queue for later sync
    if (queueFn) {
      await queueFn({ key, timestamp: Date.now() });
    }

    return null;
  }

  /**
   * Wait until device is online
   */
  public waitForOnline(timeout?: number): Promise<void> {
    if (this.isOnline) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const unsubscribe = this.subscribe((online) => {
        if (online) {
          unsubscribe();
          resolve();
        }
      });

      if (timeout) {
        setTimeout(() => {
          unsubscribe();
          reject(new Error('Timeout waiting for online status'));
        }, timeout);
      }
    });
  }

  /**
   * Get network information
   */
  public getNetworkInfo(): {
    online: boolean;
    type?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  } {
    const info: any = {
      online: this.isOnline,
    };

    // Add Network Information API data if available
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      info.type = conn.type;
      info.effectiveType = conn.effectiveType;
      info.downlink = conn.downlink;
      info.rtt = conn.rtt;
      info.saveData = conn.saveData;
    }

    return info;
  }

  /**
   * Check if connection is slow/metered
   */
  public isSlowConnection(): boolean {
    if (!('connection' in navigator)) {
      return false;
    }

    const conn = (navigator as any).connection;

    // Check for slow connection types
    if (conn.effectiveType === '4g') {
      return conn.downlink < 1; // Less than 1 Mbps
    }

    return conn.effectiveType === '3g' || conn.effectiveType === '2g';
  }

  /**
   * Should save data (user preference + slow connection)
   */
  public shouldSaveData(): boolean {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn.saveData) return true;
    }

    return this.isSlowConnection();
  }

  /**
   * Clear retry queue
   */
  public clearRetryQueue(): void {
    this.retryQueue.clear();
  }

  /**
   * Reset manager
   */
  public reset(): void {
    this.retryQueue.clear();
    this.listeners.clear();
    this.syncInProgress = false;
  }

  /**
   * Get retry statistics
   */
  public getRetryStats(): {
    queuedActions: number;
    actions: Array<{ key: string; attempts: number; lastAttempt: number }>;
  } {
    return {
      queuedActions: this.retryQueue.size,
      actions: Array.from(this.retryQueue.entries()).map(([key, data]) => ({
        key,
        ...data,
      })),
    };
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();

/**
 * Hook-like function to check online status
 */
export function isOnline(): boolean {
  return offlineManager.getOnlineStatus();
}

/**
 * Hook-like function to subscribe to online/offline changes
 */
export function onOnlineStatusChange(listener: (online: boolean) => void): () => void {
  return offlineManager.subscribe(listener);
}

/**
 * Get current network information
 */
export function getNetworkInfo() {
  return offlineManager.getNetworkInfo();
}

/**
 * Check if using slow/metered connection
 */
export function isSlowConnection(): boolean {
  return offlineManager.isSlowConnection();
}

/**
 * Check if should save data
 */
export function shouldSaveData(): boolean {
  return offlineManager.shouldSaveData();
}

/**
 * Wait for online status
 */
export async function waitForOnline(timeout?: number): Promise<void> {
  return offlineManager.waitForOnline(timeout);
}

/**
 * Sync pending actions
 */
export async function syncPending(
  onSubmit?: (action: string, data: any) => Promise<boolean>
): Promise<void> {
  return offlineManager.syncPendingData(onSubmit);
}

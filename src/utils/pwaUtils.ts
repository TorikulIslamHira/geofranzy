/**
 * PWA Utilities
 * Service worker registration, installation, and lifecycle management
 */

/**
 * Register Service Worker
 * Call this in your app initialization
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service Worker registered:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker is ready
          console.log('[PWA] New service worker available');
          handleServiceWorkerUpdate(registration);
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister Service Worker
 * Useful for debugging or disabling PWA
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[PWA] Service Worker unregistered');
    }
  } catch (error) {
    console.error('[PWA] Failed to unregister Service Worker:', error);
  }
}

/**
 * Check for Service Worker updates periodically
 */
export function checkForServiceWorkerUpdates(
  interval: number = 60000 // Check every minute
) {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  setInterval(async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.update();
      }
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
    }
  }, interval);
}

/**
 * Handle Service Worker Update
 * Notify user about new version
 */
export function handleServiceWorkerUpdate(
  registration: ServiceWorkerRegistration,
  onUpdate?: (registration: ServiceWorkerRegistration) => void
) {
  console.log('[PWA] Service Worker update available');

  if (onUpdate) {
    onUpdate(registration);
  } else {
    // Default: Show update notification
    showUpdateNotification(registration);
  }
}

/**
 * Show update notification to user
 */
function showUpdateNotification(registration: ServiceWorkerRegistration) {
  // Create banner/modal for user to reload
  const updateBanner = document.createElement('div');
  updateBanner.id = 'pwa-update-banner';
  updateBanner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: #FF6B6B;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    gap: 12px;
    align-items: center;
    z-index: 9999;
    font-family: system-ui;
  `;

  updateBanner.innerHTML = `
    <span>New version available!</span>
    <button id="pwa-reload-btn" style="
      background: white;
      color: #FF6B6B;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      margin-left: auto;
    ">Reload</button>
    <button id="pwa-dismiss-btn" style="
      background: transparent;
      color: white;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">×</button>
  `;

  document.body.appendChild(updateBanner);

  // Reload app
  document.getElementById('pwa-reload-btn')?.addEventListener('click', () => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    updateBanner.remove();
    window.location.reload();
  });

  // Dismiss banner
  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    updateBanner.remove();
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    updateBanner.remove();
  }, 10000);
}

/**
 * Request Persistent Storage
 * Ask user for permission to store data
 */
export async function requestPersistentStorage() {
  if (!('storage' in navigator) || !('persist' in navigator.storage)) {
    console.warn('Persistent Storage API not supported');
    return false;
  }

  try {
    const isPersistent = await navigator.storage.persist();
    console.log('[PWA] Persistent storage:', isPersistent ? 'granted' : 'denied');
    return isPersistent;
  } catch (error) {
    console.error('[PWA] Failed to request persistent storage:', error);
    return false;
  }
}

/**
 * Check if app is running in standalone mode (PWA installed)
 */
export function isInstalledPWA(): boolean {
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Show install prompt if available
 */
export async function promptPWAInstall(): Promise<boolean> {
  // Store deferredPrompt for later use
  let deferredPrompt: any = null;

  // Listen for beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt(deferredPrompt);
  });

  // Check if already installed
  if (isInstalledPWA()) {
    console.log('[PWA] App is already installed');
    return true;
  }

  return false;
}

/**
 * Show custom install prompt
 */
function showInstallPrompt(deferredPrompt: any) {
  if (!deferredPrompt) {
    return;
  }

  const installBanner = document.createElement('div');
  installBanner.id = 'pwa-install-banner';
  installBanner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%);
    color: white;
    padding: 16px;
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    z-index: 9999;
    font-family: system-ui;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;

  installBanner.innerHTML = `
    <div style="flex: 1;">
      <h3 style="margin: 0 0 4px 0; font-size: 16px;">Install GeoFrenzy</h3>
      <p style="margin: 0; font-size: 14px; opacity: 0.9;">
        Get quick access on your home screen
      </p>
    </div>
    <button id="pwa-install-btn" style="
      background: white;
      color: #FF6B6B;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
    ">Install</button>
    <button id="pwa-install-close" style="
      background: transparent;
      color: white;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
    ">×</button>
  `;

  document.body.insertBefore(installBanner, document.body.firstChild);

  // Install button
  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response: ${outcome}`);
    installBanner.remove();
    deferredPrompt = null;
  });

  // Close button
  document.getElementById('pwa-install-close')?.addEventListener('click', () => {
    installBanner.remove();
  });
}

/**
 * Send message to Service Worker
 */
export function sendMessageToServiceWorker(message: any) {
  if ('controller' in navigator.serviceWorker) {
    navigator.serviceWorker.controller?.postMessage(message);
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Send notification
 */
export async function sendNotification(
  title: string,
  options?: NotificationOptions
) {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not available');
    return;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options,
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

/**
 * Register Background Sync
 * Sync data when back online
 */
export async function registerBackgroundSync(tag: string) {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.warn('Background Sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register(tag);
    console.log('[PWA] Background sync registered:', tag);
    return true;
  } catch (error) {
    console.error('[PWA] Background sync registration failed:', error);
    return false;
  }
}

/**
 * Check online status with service worker
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onOnlineStatusChange(
  callback: (isOnline: boolean) => void
) {
  window.addEventListener('online', () => {
    console.log('[PWA] Back online');
    callback(true);
  });

  window.addEventListener('offline', () => {
    console.log('[PWA] Gone offline');
    callback(false);
  });
}

/**
 * Share API support
 */
export async function shareContent(data: ShareData): Promise<boolean> {
  if (!('share' in navigator)) {
    console.warn('Share API not supported');
    return false;
  }

  try {
    await navigator.share({
      title: 'GeoFrenzy',
      ...data,
    });
    return true;
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('Share failed:', error);
    }
    return false;
  }
}

/**
 * Get PWA info and metadata
 */
export function getPWAMetadata() {
  return {
    installed: isInstalledPWA(),
    online: isOnline(),
    serviceWorkerSupported: 'serviceWorker' in navigator,
    notificationsSupported: 'Notification' in window,
    backgroundSyncSupported: 'SyncManager' in window,
    shareSupported: 'share' in navigator,
    persistentStorageSupported: 'storage' in navigator,
  };
}

/**
 * Initialize PWA
 * Call once in your app root
 */
export async function initializePWA() {
  console.log('[PWA] Initializing...');

  // Register service worker
  await registerServiceWorker();

  // Check for updates
  checkForServiceWorkerUpdates(60000);

  // Request persistent storage
  await requestPersistentStorage();

  // Show install prompt
  await promptPWAInstall();

  // Listen for online/offline
  onOnlineStatusChange((isOnline) => {
    console.log('[PWA] Online status:', isOnline);
    if (isOnline) {
      // Trigger background sync when back online
      registerBackgroundSync('sync-location');
      registerBackgroundSync('sync-messages');
    }
  });

  console.log('[PWA] Initialized');
  console.log('[PWA] Metadata:', getPWAMetadata());
}

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  checkForServiceWorkerUpdates,
  isInstalledPWA,
  promptPWAInstall,
  requestNotificationPermission,
  sendNotification,
  registerBackgroundSync,
  isOnline,
  onOnlineStatusChange,
  shareContent,
  getPWAMetadata,
  initializePWA,
  sendMessageToServiceWorker,
  requestPersistentStorage,
};

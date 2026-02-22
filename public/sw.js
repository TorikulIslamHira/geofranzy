/**
 * Service Worker for GeoFrenzy PWA
 * Handles offline caching, background sync, and push notifications
 * 
 * This file should be placed in public/sw.js
 */

const CACHE_NAME = 'geofrenzy-v1';
const RUNTIME_CACHE = 'geofrenzy-runtime-v1';
const IMAGE_CACHE = 'geofrenzy-images-v1';
const API_CACHE = 'geofrenzy-api-v1';

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/offline.html',
  '/icons/favicon.ico',
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/user/',
  '/api/friends/',
  '/api/locations/',
];

/**
 * Service Worker Installation
 * Cache essential assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Install complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

/**
 * Service Worker Activation
 * Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE &&
              cacheName !== IMAGE_CACHE &&
              cacheName !== API_CACHE
            ) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('[SW] Activation failed:', error);
      })
  );
});

/**
 * Fetch Event Handler
 * Implements network-first then cache-first strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests (Network-first)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle image requests (Cache-first)
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle document/HTML requests (Network-first)
  if (
    request.mode === 'navigate' ||
    request.headers.get('accept')?.includes('text/html')
  ) {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Default: Network-first for other resources
  event.respondWith(handleRuntimeRequest(request));
});

/**
 * API Request Handler
 * Network-first strategy with cache fallback
 */
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);

    // Cache successful API responses
    if (response.status === 200) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] API fetch failed, checking cache:', request.url);

    // Try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are offline. Some features may be unavailable.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Image Request Handler
 * Cache-first strategy with network fallback
 */
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Image fetch failed:', request.url);

    // Return placeholder image or offline response
    return new Response('Image not available', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Navigation Request Handler
 * Network-first with offline HTML fallback
 */
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[SW] Navigation fetch failed, showing offline page');

    // Serve offline page
    const cached = await caches.match('/offline.html');
    if (cached) {
      return cached;
    }

    // Return generic offline response
    return new Response('You are offline', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

/**
 * Runtime Request Handler
 * Network-first for general requests
 */
async function handleRuntimeRequest(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Runtime fetch failed, checking cache:', request.url);

    // Check cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline response
    return new Response('Resource not available offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Helper function to check if request is for an image
 */
function isImageRequest(request) {
  const mimeType = request.headers.get('accept');
  if (mimeType && mimeType.includes('image')) {
    return true;
  }

  const url = new URL(request.url);
  return /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url.pathname);
}

/**
 * Background Sync Handler
 * Sync up location when back online
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-location') {
    event.waitUntil(syncLocation());
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncLocation() {
  try {
    // Get stored location from IndexedDB
    const location = await getStoredLocation();
    if (location) {
      const response = await fetch('/api/locations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location),
      });

      if (response.ok) {
        await clearStoredLocation();
        console.log('[SW] Location synced successfully');
      }
    }
  } catch (error) {
    console.error('[SW] Location sync failed:', error);
    throw error; // Retry sync
  }
}

async function syncMessages() {
  try {
    const messages = await getStoredMessages();
    if (messages.length > 0) {
      for (const message of messages) {
        const response = await fetch('/api/messages/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        });

        if (response.ok) {
          await removeStoredMessage(message.id);
        }
      }
      console.log('[SW] Messages synced successfully');
    }
  } catch (error) {
    console.error('[SW] Message sync failed:', error);
    throw error;
  }
}

/**
 * Push Notification Handler
 * Handle push notifications from server
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  const data = event.data
    ? event.data.json()
    : {
        title: 'GeoFrenzy',
        body: 'New notification received',
      };

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/open-icon.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  const notification = event.notification;
  const data = notification.data;

  if (event.action === 'close') {
    notification.close();
    return;
  }

  // Open app on notification click
  event.waitUntil(
    clients
      .matchAll({ type: 'window' })
      .then((windowClients) => {
        // Check if app is already open
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(data.url || '/');
        }
      })
  );

  notification.close();
});

/**
 * Message Events from Clients
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message from client:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }
});

/**
 * Placeholder functions for IndexedDB operations
 * Implement these based on your data storage needs
 */

async function getStoredLocation() {
  // TODO: Implement IndexedDB read
  return null;
}

async function clearStoredLocation() {
  // TODO: Implement IndexedDB delete
}

async function getStoredMessages() {
  // TODO: Implement IndexedDB query
  return [];
}

async function removeStoredMessage(messageId) {
  // TODO: Implement IndexedDB delete
}

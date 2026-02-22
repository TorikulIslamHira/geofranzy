/* eslint-disable no-undef */

const CACHE_NAME = 'geofrenzy-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

const DYNAMIC_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Failed to cache static assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Don't cache non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip certain URLs
  if (
    request.url.includes('/api/') ||
    request.url.includes('localhost:') ||
    request.url.includes('firestore.googleapis.com') ||
    request.url.includes('firebase')
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Network first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const cache = caches.open(CACHE_NAME);
          cache.then((c) => {
            c.put(request, response.clone());
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request).then((response) => {
          return response || caches.match('/index.html');
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-location-updates') {
    event.waitUntil(syncLocationUpdates());
  } else if (event.tag === 'sync-friend-requests') {
    event.waitUntil(syncFriendRequests());
  }
});

async function syncLocationUpdates() {
  try {
    const db = await openIndexedDB('geofrenzy');
    const pendingUpdates = await getFromDB(db, 'pendingLocationUpdates');

    for (const update of pendingUpdates) {
      await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });

      await deleteFromDB(db, 'pendingLocationUpdates', update.id);
    }
  } catch (error) {
    console.error('Failed to sync location updates:', error);
    throw error;
  }
}

async function syncFriendRequests() {
  try {
    const db = await openIndexedDB('geofrenzy');
    const pendingRequests = await getFromDB(db, 'pendingFriendRequests');

    for (const request of pendingRequests) {
      await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      await deleteFromDB(db, 'pendingFriendRequests', request.id);
    }
  } catch (error) {
    console.error('Failed to sync friend requests:', error);
    throw error;
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'New notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(data.title || 'GeoFrenzy', options));
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// IndexedDB helpers
function openIndexedDB(dbName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingLocationUpdates')) {
        db.createObjectStore('pendingLocationUpdates', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingFriendRequests')) {
        db.createObjectStore('pendingFriendRequests', { keyPath: 'id' });
      }
    };
  });
}

function getFromDB(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteFromDB(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Pro-Insight 360 Service Worker
 * Handles offline caching of form definitions and background sync of responses.
 * Validates: Requirements 6.1–6.7, Properties 15, 39, 40
 */

const CACHE_NAME = 'pro-insight-360-v1';
const FORM_CACHE = 'pro-insight-forms-v1';
const RESPONSE_QUEUE_KEY = 'offline-response-queue';

// Cache static assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        '/',
        '/login',
        '/my-forms',
      ]),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== FORM_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

// Cache form definitions when fetched online
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache form definition API responses
  if (url.pathname.includes('/api/forms/') && url.pathname.includes('/definition')) {
    event.respondWith(
      caches.open(FORM_CACHE).then(async (cache) => {
        try {
          const response = await fetch(event.request);
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        } catch {
          // Offline — return cached version
          const cached = await cache.match(event.request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ error: 'Offline — form not cached' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
          );
        }
      }),
    );
    return;
  }
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SYNC_RESPONSES') {
    syncPendingResponses();
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-responses') {
    event.waitUntil(syncPendingResponses());
  }
});

async function syncPendingResponses() {
  const db = await openDB();
  const pending = await getAllPending(db);

  for (const item of pending) {
    try {
      const response = await fetch('/api/responses/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cachedResponseJson: JSON.stringify(item.data) }),
      });

      if (response.ok) {
        await removeFromQueue(db, item.id);
        notifyClients({ type: 'SYNC_SUCCESS', responseId: item.data.responseId });
      } else if (response.status === 409) {
        // Conflict — notify client to resolve
        const conflict = await response.json();
        notifyClients({ type: 'SYNC_CONFLICT', conflict, localData: item.data });
      }
    } catch {
      // Network error — will retry on next sync
      notifyClients({ type: 'SYNC_ERROR', responseId: item.data.responseId });
    }
  }
}

function notifyClients(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage(message));
  });
}

// Simple IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('pro-insight-offline', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('responses')) {
        db.createObjectStore('responses', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllPending(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('responses', 'readonly');
    const req = tx.objectStore('responses').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function removeFromQueue(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('responses', 'readwrite');
    const req = tx.objectStore('responses').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

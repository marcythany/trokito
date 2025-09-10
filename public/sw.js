const CACHE_NAME = 'trokito-v1';
const STATIC_CACHE = 'trokito-static-v1';

// Arquivos para cache offline
// Currently only caching the root route since other pages don't exist yet
const STATIC_ASSETS = ['/', '/manifest.json', '/favicon.ico'];

// Install event - cache static assets
self.addEventListener('install', (event) => {
	console.log('[SW] Installing service worker');

	event.waitUntil(
		caches
			.open(STATIC_CACHE)
			.then((cache) => {
				console.log('[SW] Caching static assets');
				return cache.addAll(STATIC_ASSETS);
			})
			.then(() => {
				console.log('[SW] Static assets cached');
				return self.skipWaiting();
			})
			.catch((error) => {
				console.error('[SW] Error caching static assets:', error);
			})
	);
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
	console.log('[SW] Activating service worker');

	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
							console.log('[SW] Deleting old cache:', cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => {
				console.log('[SW] Service worker activated');
				return self.clients.claim();
			})
	);
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') {
		return;
	}

	// Skip external requests
	if (!event.request.url.startsWith(self.location.origin)) {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				console.log('[SW] Serving from cache:', event.request.url);
				return cachedResponse;
			}

			console.log('[SW] Fetching from network:', event.request.url);
			return fetch(event.request)
				.then((response) => {
					// Don't cache non-successful responses
					if (
						!response ||
						response.status !== 200 ||
						response.type !== 'basic'
					) {
						return response;
					}

					// Clone the response
					const responseToCache = response.clone();

					// Cache the response
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseToCache);
					});

					return response;
				})
				.catch((error) => {
					console.error('[SW] Fetch failed:', error);

					// Return offline page for navigation requests
					if (event.request.mode === 'navigate') {
						return caches.match('/');
					}

					throw error;
				});
		})
	);
});

// Background sync for data synchronization
self.addEventListener('sync', (event) => {
	console.log('[SW] Background sync triggered:', event.tag);

	if (event.tag === 'sync-closings') {
		event.waitUntil(syncClosings());
	}
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
	console.log('[SW] Push notification received');

	const options = {
		body: event.data ? event.data.text() : 'Nova notificação do Trokito',
		icon: '/favicon.ico',
		badge: '/favicon.ico',
		vibrate: [200, 100, 200],
		data: {
			dateOfArrival: Date.now(),
			primaryKey: 1,
		},
		actions: [
			{
				action: 'explore',
				title: 'Abrir App',
				icon: '/favicon.ico',
			},
			{
				action: 'close',
				title: 'Fechar',
				icon: '/favicon.ico',
			},
		],
	};

	event.waitUntil(self.registration.showNotification('Trokito', options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
	console.log('[SW] Notification clicked:', event.action);

	event.notification.close();

	if (event.action === 'explore') {
		event.waitUntil(clients.openWindow('/'));
	}
});

// Helper function for syncing closings (placeholder)
async function syncClosings() {
	try {
		console.log('[SW] Syncing closings...');
		// Implementar sincronização quando houver backend
		return Promise.resolve();
	} catch (error) {
		console.error('[SW] Error syncing closings:', error);
		throw error;
	}
}

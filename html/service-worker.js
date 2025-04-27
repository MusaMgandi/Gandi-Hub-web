const CACHE_NAME = 'gandi-hub-v2'; // Updated cache version
const urlsToCache = [
  './',
  './academics.html',
  './login.html',
  './signup.html',
  '../css/common.css',
  '../css/login.css',
  '../css/auth.css',
  '../js/auth.js',
  '../js/calendar-fix.js',
  '../js/academics.js',
  '../images/rugbylogo.png'
];

self.addEventListener('install', event => {
  // Skip waiting to activate new service worker immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        // Cache each URL individually to prevent a single failure from aborting the entire operation
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.error(`[Service Worker] Failed to cache: ${url}`, error);
              // Continue even if one URL fails
              return Promise.resolve();
            });
          })
        );
      })
      .catch(error => {
        console.error('[Service Worker] Install cache error:', error);
      })
  );
});

self.addEventListener('activate', event => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone();
            
            // Don't cache if the URL contains certain patterns
            if (!event.request.url.includes('firebase') && 
                !event.request.url.includes('googleapis')) {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(error => {
            console.log('[Service Worker] Fetch failed:', error);
            // You can provide a custom offline page here
          });
      })
  );
});

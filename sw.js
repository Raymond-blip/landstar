// Service Worker for Push Notifications - Enhanced for Mobile
const CACHE_NAME = 'werner-news-v2';
const STATIC_CACHE = 'werner-static-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.htm',
  '/media/werner logo.png',
  '/css/main.css'
];

// Install event - Cache static files
self.addEventListener('install', event => {
  console.log('📱 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching static files...');
        return cache.addAll(STATIC_FILES.filter(url => url !== '/css/main.css')); // Skip non-existent files
      })
      .catch(err => console.log('⚠️ Cache install failed:', err))
      .finally(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('📱 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Push event - handle incoming push notifications (Mobile-optimized)
self.addEventListener('push', event => {
  console.log('🔔 Push notification received');
  
  if (!event.data) {
    console.log('❌ No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📱 Push data:', data);

    // Mobile-optimized notification options
    const options = {
      body: data.body,
      icon: data.icon || '/media/werner logo.png',
      badge: data.badge || '/media/werner logo.png',
      image: data.image,
      data: {
        url: data.url || '/',
        timestamp: data.timestamp || Date.now()
      },
      actions: data.actions || [
        {
          action: 'view',
          title: 'View News',
          icon: '/media/werner logo.png'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ],
      requireInteraction: false, // Don't require interaction on mobile
      silent: false,
      tag: data.tag || 'werner-news',
      renotify: data.renotify || true,
      vibrate: data.vibrate || [200, 100, 200], // Mobile vibration
      timestamp: data.timestamp || Date.now(),
      // Mobile-specific options
      dir: 'ltr',
      lang: 'en'
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
        .then(() => {
          console.log('✅ Notification displayed successfully');
          
          // Track notification display (optional analytics)
          if (self.clients) {
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  type: 'NOTIFICATION_DISPLAYED',
                  title: data.title,
                  timestamp: Date.now()
                });
              });
            });
          }
        })
        .catch(err => {
          console.error('❌ Failed to show notification:', err);
        })
    );
  } catch (error) {
    console.error('❌ Error handling push notification:', error);
    
    // Fallback notification for mobile
    event.waitUntil(
      self.registration.showNotification('Werner News Update', {
        body: 'New transportation industry news is available!',
        icon: '/media/werner logo.png',
        badge: '/media/werner logo.png',
        data: { url: '/' },
        tag: 'werner-news-fallback',
        requireInteraction: false,
        vibrate: [200, 100, 200]
      })
    );
  }
});

// Notification click event - Mobile-optimized
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then(clientList => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url.includes(new URL(urlToOpen, self.location.origin).pathname) && 'focus' in client) {
          console.log('📱 Focusing existing window');
          return client.focus();
        }
      }
      
      // If no existing window/tab, open a new one
      if (clients.openWindow) {
        console.log('📱 Opening new window:', urlToOpen);
        return clients.openWindow(urlToOpen);
      }
    }).catch(err => {
      console.error('❌ Error handling notification click:', err);
      // Fallback: try to open the main page
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle notification close event (mobile analytics)
self.addEventListener('notificationclose', event => {
  console.log('🔕 Notification closed:', event.notification.tag);
  
  // Optional: Track notification dismissals
  if (self.clients) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'NOTIFICATION_CLOSED',
          tag: event.notification.tag,
          timestamp: Date.now()
        });
      });
    });
  }
});

// Background sync for offline functionality (optional)
self.addEventListener('sync', event => {
  if (event.tag === 'news-sync') {
    console.log('🔄 Background sync: news-sync');
    // Could implement offline news sync here
  }
});

// Fetch event for caching and offline support
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    // For API requests, try network first, then show offline message
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          if (url.pathname === '/api/news') {
            // Return offline news response
            return new Response(JSON.stringify({
              ok: true,
              offline: true,
              news: [
                {
                  title: "Offline Mode - Transportation News",
                  description: "You're currently offline. Please check your internet connection to load the latest news.",
                  publishedAt: new Date().toISOString(),
                  source: { name: "Offline" },
                  url: "#"
                }
              ]
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // For other API requests, return error
          return new Response(JSON.stringify({
            ok: false,
            error: 'Offline - Please check your internet connection'
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // For static files, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('📦 Serving from cache:', event.request.url);
          return response;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response for caching
            const responseToCache = response.clone();
            
            // Cache static assets
            if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
              caches.open(STATIC_CACHE)
                .then(cache => cache.put(event.request, responseToCache))
                .catch(err => console.log('Cache put failed:', err));
            }
            
            return response;
          })
          .catch(() => {
            // Network failed, try to serve a cached fallback
            if (url.pathname === '/' || url.pathname === '/index.htm') {
              return caches.match('/index.htm') || caches.match('/');
            }
            
            // For other requests, return a generic offline response
            return new Response('Offline - Please check your internet connection', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
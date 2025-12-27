// Service Worker for Push Notifications
const CACHE_NAME = 'werner-news-v1';

// Install event
self.addEventListener('install', event => {
  console.log('📱 Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  console.log('📱 Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', event => {
  console.log('🔔 Push notification received');
  
  if (!event.data) {
    console.log('❌ No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📱 Push data:', data);

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
      requireInteraction: false,
      silent: false,
      tag: 'werner-news',
      renotify: true,
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('❌ Error handling push notification:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('Werner News Update', {
        body: 'New transportation industry news is available!',
        icon: '/media/werner logo.png',
        badge: '/media/werner logo.png',
        data: { url: '/' }
      })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no existing window/tab, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline functionality (optional)
self.addEventListener('sync', event => {
  if (event.tag === 'news-sync') {
    console.log('🔄 Background sync: news-sync');
    // Could implement offline news sync here
  }
});

// Fetch event for caching (optional)
self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip caching for API requests
  if (event.request.url.includes('/api/')) return;
  
  // Basic caching strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
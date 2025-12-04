import { Request, Response, Router } from 'express';

const router = Router();

/**
 * GET /api/manifest or /manifest.json
 * Returns the Web App Manifest for PWA installation
 */
router.get('/manifest.json', (req: Request, res: Response) => {
  const manifest = {
    name: 'Video Game Wingman',
    short_name: 'Wingman',
    description: 'Your AI Co-Pilot delivers real-time tips, secrets, and pro-level insights while you play.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#FF0000',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    categories: ['games', 'entertainment'],
    screenshots: [],
    shortcuts: [],
    share_target: undefined,
    related_applications: [],
    prefer_related_applications: false
  };

  // Set proper headers for manifest
  res.setHeader('Content-Type', 'application/manifest+json');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.status(200).json(manifest);
});

/**
 * GET /api/manifest
 * Alias for /manifest.json for API consistency
 */
router.get('/api/manifest', (req: Request, res: Response) => {
  // Redirect to manifest.json or serve directly
  const manifest = {
    name: 'Video Game Wingman',
    short_name: 'Wingman',
    description: 'Your AI Co-Pilot delivers real-time tips, secrets, and pro-level insights while you play.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#FF0000',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    categories: ['games', 'entertainment'],
    screenshots: [],
    shortcuts: [],
    related_applications: [],
    prefer_related_applications: false
  };

  res.setHeader('Content-Type', 'application/manifest+json');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).json(manifest);
});

/**
 * GET /service-worker.js
 * Returns the service worker JavaScript file
 * Note: The actual service worker will be created by the frontend,
 * but this endpoint can serve a basic template or redirect to the static file
 */
router.get('/service-worker.js', (req: Request, res: Response) => {
  // Basic service worker template
  // Frontend will provide the actual service worker implementation
  const serviceWorker = `
// Service Worker for Video Game Wingman PWA
// Version: 1.0.0
const CACHE_NAME = 'wingman-v1';
const STATIC_CACHE_NAME = 'wingman-static-v1';
const DYNAMIC_CACHE_NAME = 'wingman-dynamic-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      // Static assets will be cached by the frontend
      return cache.addAll([
        '/',
        '/manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Cache-first strategy for static assets
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchResponse) => {
          return caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // Network-first strategy for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then((fetchResponse) => {
        const responseClone = fetchResponse.clone();
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return fetchResponse;
      }).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(request).then((fetchResponse) => {
      if (fetchResponse.ok) {
        const responseClone = fetchResponse.clone();
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
      }
      return fetchResponse;
    }).catch(() => {
      return caches.match(request).then((response) => {
        return response || new Response('Offline', { status: 503 });
      });
    })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncForms());
  }
});

async function syncForms() {
  // This will be implemented by the frontend
  console.log('[Service Worker] Syncing forms...');
}
`;

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Service workers should not be cached
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.status(200).send(serviceWorker);
});

/**
 * POST /api/pwa/install
 * Tracks PWA installation events
 * Body:
 *   - userId: (optional) user's userId
 *   - email: (optional) user's email
 *   - deviceInfo: (optional) device information
 *   - platform: (optional) platform (iOS, Android, Desktop)
 */
router.post('/api/pwa/install', async (req: Request, res: Response) => {
  try {
    const { userId, email, deviceInfo, platform } = req.body;

    // Log installation event
    const installationData = {
      userId: userId || null,
      email: email || null,
      deviceInfo: deviceInfo || null,
      platform: platform || 'unknown',
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.ip || req.socket.remoteAddress || 'unknown'
    };

    // Log to console (in production, this could be sent to analytics service)
    console.log('[PWA Installation]', JSON.stringify(installationData, null, 2));

    // In the future, this could store to database or send to analytics service
    // For now, we'll just log it

    return res.status(200).json({
      success: true,
      message: 'Installation tracked successfully',
      timestamp: installationData.timestamp
    });
  } catch (error) {
    console.error('Error tracking PWA installation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to track installation'
    });
  }
});

/**
 * GET /api/pwa/status
 * Returns PWA status and configuration
 */
router.get('/api/pwa/status', (req: Request, res: Response) => {
  const pwaStatus = {
    enabled: true,
    manifest: {
      available: true,
      path: '/manifest.json',
      apiPath: '/api/manifest'
    },
    serviceWorker: {
      available: true,
      path: '/service-worker.js'
    },
    features: {
      offline: true,
      installable: true,
      backgroundSync: true,
      pushNotifications: false // Not implemented yet
    },
    version: '1.0.0',
    timestamp: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    pwa: pwaStatus
  });
});

export default router;

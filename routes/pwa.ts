import { Request, Response, Router } from 'express';
import { offlineQueue, QueuedAction } from '../utils/offlineQueue';
import axios from 'axios';

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
// Version: 2.0.0 - Updated with ImageKit support
const CACHE_NAME = 'wingman-v2';
const STATIC_CACHE_NAME = 'wingman-static-v2';
const DYNAMIC_CACHE_NAME = 'wingman-dynamic-v2';

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

  // Handle ImageKit images (cross-origin image requests)
  if (request.destination === 'image' && url.hostname.includes('imagekit.io')) {
    // For ImageKit images, use network-first strategy with cache fallback
    event.respondWith(
      fetch(request, { mode: 'cors' }).then((fetchResponse) => {
        if (fetchResponse.ok) {
          const responseClone = fetchResponse.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return fetchResponse;
      }).catch((error) => {
        console.error('[Service Worker] Image fetch failed:', request.url, error);
        // Try to return cached version if available
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return a placeholder or error response
          return new Response('Image unavailable', { 
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
    );
    return;
  }

  // Skip other cross-origin requests
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
// Note: Background Sync API requires browser support and proper registration
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync event:', event.tag);
    if (event.tag === 'sync-forms' || event.tag.startsWith('sync-queue-')) {
      event.waitUntil(syncForms(event.tag));
    }
  });
} else {
  console.warn('[Service Worker] Background Sync API not supported in this browser');
}

async function syncForms(tag) {
  try {
    console.log('[Service Worker] Syncing forms with tag:', tag);
    
    // Get all pending actions from IndexedDB (frontend should store them)
    // Then call the backend queue process endpoint
    const response = await fetch('/api/pwa/queue/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ processAll: true })
    });
    
    const result = await response.json();
    console.log('[Service Worker] Queue processed:', result);
    
    if (result.success) {
      // Notify all clients about successful sync
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          result: result
        });
      });
    }
  } catch (error) {
    console.error('[Service Worker] Error syncing forms:', error);
    // Re-throw to let the browser retry
    throw error;
  }
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
  const queueStats = offlineQueue.getStats();
  
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
      backgroundSync: true, // Backend supports it, but browser support varies
      offlineQueue: true,
      offlineCaching: true,
      pushNotifications: false // Not implemented yet
    },
    queue: {
      enabled: true,
      stats: queueStats,
      endpoints: {
        queue: '/api/pwa/queue',
        process: '/api/pwa/queue/process',
        status: '/api/pwa/queue/status'
      }
    },
    version: '2.0.0', // Updated for Epic 2
    timestamp: new Date().toISOString(),
    notes: {
      backgroundSync: 'Background Sync API support depends on browser. Frontend should check for registration.sync availability before using.'
    }
  };

  res.status(200).json({
    success: true,
    pwa: pwaStatus
  });
});

/**
 * POST /api/pwa/queue
 * Accepts queued actions from offline users
 * Body:
 *   - action: string (e.g., 'waitlist-signup', 'forum-post', 'forum-update', 'forum-delete', 'forum-like')
 *   - endpoint: string (original endpoint path, e.g., '/api/waitlist', '/api/public/forum-posts')
 *   - method: string (HTTP method: 'POST', 'PUT', 'DELETE')
 *   - body: object (original request body)
 *   - headers: object (optional, original request headers)
 *   - userId: string (optional, user identifier)
 */
router.post('/api/pwa/queue', (req: Request, res: Response) => {
  try {
    const { action, endpoint, method, body, headers, userId } = req.body;

    // Validation
    if (!action || typeof action !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Action type is required'
      });
    }

    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Endpoint is required'
      });
    }

    if (!method || !['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Valid HTTP method is required (POST, PUT, DELETE, PATCH)'
      });
    }

    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Request body is required'
      });
    }

    // Add action to queue
    const queuedAction = offlineQueue.addAction(
      action,
      endpoint,
      method.toUpperCase(),
      body,
      headers,
      userId
    );

    return res.status(201).json({
      success: true,
      message: 'Action queued successfully',
      queueId: queuedAction.id,
      action: {
        id: queuedAction.id,
        action: queuedAction.action,
        status: queuedAction.status,
        timestamp: queuedAction.timestamp
      }
    });
  } catch (error) {
    console.error('Error queueing action:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to queue action'
    });
  }
});

/**
 * POST /api/pwa/queue/process
 * Processes queued actions (called when user comes back online)
 * Body:
 *   - queueIds: string[] (optional, specific queue IDs to process)
 *   - userId: string (optional, process all actions for a specific user)
 *   - processAll: boolean (optional, process all pending actions)
 */
router.post('/api/pwa/queue/process', async (req: Request, res: Response) => {
  try {
    const { queueIds, userId, processAll } = req.body;

    let actionsToProcess: QueuedAction[] = [];

    if (queueIds && Array.isArray(queueIds)) {
      // Process specific queue IDs
      actionsToProcess = queueIds
        .map((id: string) => offlineQueue.getActionById(id))
        .filter((action): action is QueuedAction => action !== undefined && action.status === 'pending');
    } else if (userId && typeof userId === 'string') {
      // Process all actions for a specific user
      actionsToProcess = offlineQueue.getActionsByUserId(userId).filter(a => a.status === 'pending');
    } else if (processAll === true) {
      // Process all pending actions
      actionsToProcess = offlineQueue.getPendingActions();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either queueIds, userId, or processAll must be provided'
      });
    }

    if (actionsToProcess.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pending actions to process',
        processed: 0,
        succeeded: 0,
        failed: 0
      });
    }

    // Process actions
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ queueId: string; error: string }>
    };

    // Get base URL for internal API calls
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

    for (const action of actionsToProcess) {
      try {
        // Mark as processing
        const canProcess = offlineQueue.updateActionStatus(action.id, 'processing');
        if (!canProcess) {
          const current = offlineQueue.getActionById(action.id);
          const errorMsg = current?.error || 'Max retries exceeded';
          results.failed++;
          results.errors.push({
            queueId: action.id,
            error: errorMsg
          });
          results.processed++;
          continue;
        }

        // Make the actual API call with timeout (25 seconds to match frontend and stay under Heroku's 30s limit)
        const response = await axios({
          method: action.method,
          url: `${baseUrl}${action.endpoint}`,
          data: action.body,
          headers: {
            'Content-Type': 'application/json',
            ...action.headers
          },
          timeout: 25000, // 25 seconds timeout
          validateStatus: () => true // Don't throw on any status
        });

        if (response.status >= 200 && response.status < 300) {
          // Success
          offlineQueue.updateActionStatus(action.id, 'completed');
          results.succeeded++;
        } else {
          // Failed
          const errorMsg = response.data?.message || `HTTP ${response.status}`;
          offlineQueue.updateActionStatus(action.id, 'failed', errorMsg);
          const current = offlineQueue.getActionById(action.id);
          results.failed++;
          results.errors.push({
            queueId: action.id,
            error: current?.status === 'pending' ? `${errorMsg} (will retry)` : errorMsg
          });
        }
      } catch (error: any) {
        // Network or other error
        const errorMsg = error.message || 'Unknown error';
        offlineQueue.updateActionStatus(action.id, 'failed', errorMsg);
        const current = offlineQueue.getActionById(action.id);
        results.failed++;
        results.errors.push({
          queueId: action.id,
          error: current?.status === 'pending' ? `${errorMsg} (will retry)` : errorMsg
        });
      }

      results.processed++;
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${results.processed} actions`,
      ...results
    });
  } catch (error) {
    console.error('Error processing queue:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process queue'
    });
  }
});

/**
 * GET /api/pwa/queue/status
 * Returns queue status and pending actions
 * Query params:
 *   - userId: string (optional, filter by user ID)
 */
router.get('/api/pwa/queue/status', (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    const stats = offlineQueue.getStats();
    let actions: QueuedAction[] = [];

    if (userId && typeof userId === 'string') {
      actions = offlineQueue.getActionsByUserId(userId);
    } else {
      actions = offlineQueue.getPendingActions().slice(0, 50); // Limit to 50 for response size
    }

    return res.status(200).json({
      success: true,
      stats,
      actions: actions.map(action => ({
        id: action.id,
        action: action.action,
        endpoint: action.endpoint,
        method: action.method,
        status: action.status,
        retries: action.retries,
        timestamp: action.timestamp,
        userId: action.userId
      }))
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get queue status'
    });
  }
});

export default router;

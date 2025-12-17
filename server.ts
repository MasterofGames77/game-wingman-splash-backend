import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import waitlistRoutes from './routes/waitlist';
import getWaitlistPositionRoute from './routes/getWaitlistPosition';
import approveUserRoute from './routes/approveUser';
import publicForumPostsRoute from './routes/publicForumPosts';
import uploadForumImageRoute from './routes/uploadForumImage';
import linkedinPostsRoute from './routes/linkedinPosts';
import pwaRoutes from './routes/pwa';
// import publicQuestionResponsesRoute from './routes/publicQuestionResponses'; // Commented out - may not be needed for splash page

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const whitelist = [
      'http://localhost:3000',
      'https://videogamewingman.com',
      'https://www.videogamewingman.com',
    ];
    
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in whitelist
    if (whitelist.indexOf(origin) !== -1) {
      // Only log CORS in development to reduce console noise
      if (process.env.NODE_ENV === 'development') {
        console.log(`CORS request from origin: ${origin}`);
      }
      return callback(null, true);
    }
    
    // Always log blocked requests for security monitoring
    console.warn(`CORS request blocked from origin: ${origin}`);
    callback(new Error(`Not allowed by CORS policy. Origin: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());

// NOTE: CSP headers are handled by Cloudflare Transform Rules
// Backend CSP removed to avoid conflicts - Cloudflare is the single source of truth
// If Cloudflare is not active, backend can set CSP as fallback (see commented code below)
// 
// To re-enable backend CSP (not recommended when using Cloudflare):
// Uncomment the middleware below and ensure it matches Cloudflare CSP exactly
/*
app.use((req: Request, res: Response, next: NextFunction) => {
  // Only set CSP if Cloudflare hasn't already set it
  const existingCSP = res.getHeader('Content-Security-Policy');
  if (!existingCSP) {
    const cspPolicy = 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com https://static.cloudflareinsights.com https://*.cloudflareinsights.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://api.openai.com https://*.openai.com https://api.igdb.com https://api.rawg.io https://api.stripe.com https://checkout.stripe.com https://www.google-analytics.com https://www.googletagmanager.com https://cloudflareinsights.com https://*.cloudflareinsights.com https://*.herokuapp.com https://ik.imagekit.io https://*.imagekit.io wss: ws:; " +
      "frame-src 'self' https://checkout.stripe.com; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "frame-ancestors 'none';";
    res.setHeader('Content-Security-Policy', cspPolicy);
  }
  next();
});
*/

// Routes logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
    if (req.method === 'PUT' || req.method === 'POST') {
      console.log('Request body keys:', Object.keys(req.body || {}));
    }
    next();
  });
}

// PWA routes - register BEFORE static files to handle /manifest.json and /service-worker.js
// This ensures route handlers take precedence over static file serving
app.use('/', pwaRoutes);

// Serve static files from public directory with proper cache headers
app.use(express.static('public', {
  maxAge: '1y', // Cache static assets for 1 year
  etag: true, // Enable ETag for cache validation
  lastModified: true, // Enable Last-Modified headers
  setHeaders: (res: Response, path: string) => {
    // Set different cache headers based on file type
    if (path.endsWith('.html')) {
      // HTML files should be revalidated more frequently
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (path.endsWith('.js') || path.endsWith('.css')) {
      // JS and CSS files can be cached longer, but with versioning
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (path.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
      // Images can be cached for a long time
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (path.endsWith('.woff') || path.endsWith('.woff2') || path.endsWith('.ttf') || path.endsWith('.eot')) {
      // Fonts can be cached for a long time
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Service worker should never be cached
    if (path.endsWith('service-worker.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // Manifest should be cached but revalidated
    if (path.endsWith('manifest.json')) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// MongoDB connection to Splash Page MongoDB
// Don't block server startup if DB connection fails - it will retry when needed
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB (Splash Page) connected successfully'))
    .catch((err: any) => {
      console.error('MongoDB connection error (Splash Page):', err.message);
      // Don't exit - let server start and connections will retry when needed
    });
} else {
  console.warn('MONGO_URI environment variable is not set. Database connections may fail.');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', waitlistRoutes);
app.use('/api', getWaitlistPositionRoute);
app.use('/api', approveUserRoute);
// Register upload route BEFORE forum posts route to ensure /api/public/forum-posts/upload-image is matched first
app.use('/api', uploadForumImageRoute);
app.use('/api', publicForumPostsRoute);
app.use('/api', linkedinPostsRoute);
// app.use('/api', publicQuestionResponsesRoute); // Commented out - may not be needed for splash page

// Debug: Log registered routes (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('Registered public forum posts route: /api/public/forum-posts');
}

// Global error-handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[${new Date().toISOString()}] Global error handler:`, err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) // Include stack trace in development mode
  });
});

// Health check endpoint (for debugging deployment)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasMongoUri: !!process.env.MONGO_URI,
      hasWingmanDbUri: !!process.env.MONGODB_URI_WINGMAN,
      hasSplashForumId: !!process.env.SPLASH_PAGE_FORUM_ID,
      nodeEnv: process.env.NODE_ENV || 'not set',
    },
    pwa: {
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
      statusEndpoint: '/api/pwa/status',
      installEndpoint: '/api/pwa/install'
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});
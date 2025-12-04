/**
 * Cache Headers Middleware
 * 
 * Adds appropriate cache headers to API responses for offline content caching.
 * Supports stale-while-revalidate strategy for dynamic content.
 */

import { Request, Response, NextFunction } from 'express';

export interface CacheOptions {
  maxAge?: number; // Max age in seconds
  staleWhileRevalidate?: number; // Stale-while-revalidate in seconds
  mustRevalidate?: boolean; // Whether to require revalidation
  private?: boolean; // Whether response is private (user-specific)
}

/**
 * Middleware to add cache headers to responses
 */
export function addCacheHeaders(options: CacheOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const {
      maxAge = 300, // Default: 5 minutes
      staleWhileRevalidate = 86400, // Default: 24 hours
      mustRevalidate = false,
      private: isPrivate = false
    } = options;

    // Build Cache-Control header
    const cacheControlParts: string[] = [];

    if (isPrivate) {
      cacheControlParts.push('private');
    } else {
      cacheControlParts.push('public');
    }

    cacheControlParts.push(`max-age=${maxAge}`);

    if (staleWhileRevalidate > 0) {
      cacheControlParts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }

    if (mustRevalidate) {
      cacheControlParts.push('must-revalidate');
    }

    res.setHeader('Cache-Control', cacheControlParts.join(', '));

    // Add ETag for cache validation (based on response content)
    // This will be set after response is sent, but we prepare the header here
    res.setHeader('Vary', 'Accept, Accept-Encoding');

    next();
  };
}

/**
 * Preset cache configurations for different content types
 */
export const cachePresets = {
  // Forum posts - cached for offline viewing
  forumPosts: addCacheHeaders({
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: 86400, // 24 hours
    mustRevalidate: false
  }),

  // LinkedIn posts - cached for offline viewing
  linkedinPosts: addCacheHeaders({
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: 86400, // 24 hours
    mustRevalidate: false
  }),

  // Static content - cache for longer
  staticContent: addCacheHeaders({
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: 86400, // 24 hours
    mustRevalidate: false
  }),

  // User-specific content - private cache
  userContent: addCacheHeaders({
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 300, // 5 minutes
    mustRevalidate: false,
    private: true
  }),

  // No cache - for dynamic/real-time content
  noCache: addCacheHeaders({
    maxAge: 0,
    staleWhileRevalidate: 0,
    mustRevalidate: true,
    private: true
  })
};

/**
 * Helper to generate ETag from response data
 */
export function generateETag(data: any): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  // Simple hash function (in production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(36)}"`;
}

/**
 * Middleware to add ETag to response
 */
export function addETag(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  
  res.json = function (body: any) {
    // Generate ETag from response body
    const etag = generateETag(body);
    res.setHeader('ETag', etag);

    // Check if client has matching ETag (304 Not Modified)
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch === etag) {
      return res.status(304).end();
    }

    return originalJson(body);
  };

  next();
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const databaseConnections_1 = require("../utils/databaseConnections");
const router = (0, express_1.Router)();
// Specific forum to showcase on splash page
// Forum: "Favorite Hero in Xenoblade Chronicles 3"
// forumId: "forum_1760222601584_k4k6xncld"
// This can be moved to an environment variable if needed
const SPLASH_PAGE_FORUM_ID = process.env.SPLASH_PAGE_FORUM_ID || "forum_1760222601584_k4k6xncld";
/**
 * GET /api/public/forum-posts
 * Returns posts from a specific forum for preview on the splash page
 * Query params:
 *   - limit: number of posts to return (default: 1, max: 3)
 *   - offset: number of posts to skip (default: 0) - for pagination
 *
 * Usage:
 *   - Initial load: GET /api/public/forum-posts?limit=1&offset=0 (loads 1st post)
 *   - Load more: GET /api/public/forum-posts?limit=2&offset=1 (loads 2nd and 3rd posts)
 */
router.get('/public/forum-posts', async (req, res) => {
    try {
        // Parse and validate limit parameter
        const limitParam = req.query.limit;
        let limit = 1; // default: show first post initially
        if (limitParam) {
            const parsedLimit = parseInt(String(limitParam), 10);
            if (!isNaN(parsedLimit) && parsedLimit > 0) {
                limit = Math.min(parsedLimit, 4); // cap at 4 for splash page preview
            }
        }
        // Parse and validate offset parameter
        const offsetParam = req.query.offset;
        let offset = 0; // default: start from beginning
        if (offsetParam) {
            const parsedOffset = parseInt(String(offsetParam), 10);
            if (!isNaN(parsedOffset) && parsedOffset >= 0) {
                offset = parsedOffset;
            }
        }
        // Connect to main application database
        const wingmanDB = await (0, databaseConnections_1.connectToWingmanDB)();
        const db = wingmanDB.db;
        if (!db) {
            throw new Error('Failed to connect to database');
        }
        // Query the specific forum from the main database
        const forumsCollection = db.collection('forums');
        // Find the specific forum by forumId (allow private forums for splash page preview)
        const forum = await forumsCollection.findOne({ forumId: SPLASH_PAGE_FORUM_ID }, {
            projection: {
                _id: 0,
                forumId: 1,
                gameTitle: 1,
                title: 1,
                category: 1,
                posts: 1, // We need the posts array
                createdAt: 1,
                updatedAt: 1,
                // Exclude sensitive fields
            }
        });
        if (!forum) {
            // Debug logging only in development mode
            if (process.env.NODE_ENV === 'development') {
                console.log('Forum not found by forumId:', SPLASH_PAGE_FORUM_ID);
                const sampleForums = await forumsCollection.find({}, { projection: { forumId: 1, title: 1 } }).limit(5).toArray();
                console.log('Sample forums in database:', sampleForums);
            }
            return res.status(404).json({
                success: false,
                message: 'Forum not found for preview',
                ...(process.env.NODE_ENV === 'development' && {
                    debug: {
                        searchedForumId: SPLASH_PAGE_FORUM_ID,
                        envVarSet: !!SPLASH_PAGE_FORUM_ID
                    }
                })
            });
        }
        // Extract posts array from forum document
        const allPosts = forum.posts || [];
        // Sort posts by timestamp (if available) or keep original order
        // Posts should be sorted chronologically (oldest first, typically)
        const sortedPosts = [...allPosts].sort((a, b) => {
            const timeA = a.timestamp || a.createdAt || a.date || 0;
            const timeB = b.timestamp || b.createdAt || b.date || 0;
            return timeA - timeB; // Ascending order (oldest first)
        });
        // Apply pagination: slice posts array based on offset and limit
        const paginatedPosts = sortedPosts.slice(offset, offset + limit);
        // Transform posts to ensure consistent response format
        const previewPosts = paginatedPosts.map((post) => {
            return {
                author: post.author || post.postedBy || post.createdBy || 'Anonymous',
                content: post.content || post.message || post.text || '',
                timestamp: post.timestamp || post.createdAt || post.date || new Date().toISOString(),
                likes: post.likes || post.likeCount || 0,
            };
        });
        // Return forum metadata along with posts
        return res.status(200).json({
            success: true,
            forum: {
                forumId: forum.forumId,
                title: forum.title || 'Untitled Forum',
                gameTitle: forum.gameTitle || null,
                category: forum.category || null,
                totalPosts: allPosts.length,
            },
            posts: previewPosts,
            count: previewPosts.length,
            hasMore: offset + limit < allPosts.length, // Indicates if more posts are available
        });
    }
    catch (error) {
        console.error('Error fetching forum posts for preview:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch forum posts',
            // Include error details in development only
            ...(process.env.NODE_ENV === 'development' && { error: error instanceof Error ? error.message : 'Unknown error' })
        });
    }
});
exports.default = router;

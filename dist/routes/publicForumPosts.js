"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const databaseConnections_1 = require("../utils/databaseConnections");
const User_1 = __importDefault(require("../models/User"));
const validator_1 = require("validator");
const mongodb_1 = require("mongodb");
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
 *   - limit: number of posts to return (default: 1, max: 1 - loads one at a time)
 *   - offset: number of posts to skip (default: 0) - for pagination
 *   - userId: (optional) user's userId to check if they've liked each post
 *
 * Usage:
 *   - Initial load: GET /api/public/forum-posts?limit=1&offset=0 (loads 1st post)
 *   - With user context: GET /api/public/forum-posts?limit=1&offset=0&userId=user-xxx (includes isLiked field)
 *   - Load more: GET /api/public/forum-posts?limit=1&offset=1&userId=user-xxx (loads 2nd post)
 *   - etc.
 */
router.get('/public/forum-posts', async (req, res) => {
    try {
        // Get userId from query params (optional)
        const userId = String(req.query.userId || '').trim();
        // Parse and validate limit parameter
        // Always load 1 post at a time for splash page preview
        const limitParam = req.query.limit;
        let limit = 1; // default: show first post initially
        if (limitParam) {
            const parsedLimit = parseInt(String(limitParam), 10);
            if (!isNaN(parsedLimit) && parsedLimit > 0) {
                limit = Math.min(parsedLimit, 1); // cap at 1 - load one post at a time
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
        if (!process.env.MONGODB_URI_WINGMAN) {
            return res.status(500).json({
                success: false,
                message: 'Database configuration error: MONGODB_URI_WINGMAN not set',
            });
        }
        const wingmanDB = await (0, databaseConnections_1.connectToWingmanDB)();
        const db = wingmanDB.db;
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Failed to connect to database',
            });
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
        // Posts should be sorted chronologically (newest first) so new posts from splash page appear at the top
        const sortedPosts = [...allPosts].sort((a, b) => {
            const timeA = a.timestamp || a.createdAt || a.date || 0;
            const timeB = b.timestamp || b.createdAt || b.date || 0;
            return timeB - timeA; // Descending order (newest first)
        });
        // Apply pagination: slice posts array based on offset and limit
        const paginatedPosts = sortedPosts.slice(offset, offset + limit);
        // Transform posts to ensure consistent response format
        const previewPosts = paginatedPosts.map((post) => {
            // Extract likes from metadata.likes (primary) or count metadata.likedBy array (fallback)
            let likes = 0;
            if (post.metadata && post.metadata.likes !== undefined && post.metadata.likes !== null) {
                // Primary: likes stored as number in metadata.likes
                likes = typeof post.metadata.likes === 'number' ? post.metadata.likes : 0;
            }
            else if (post.metadata && post.metadata.likedBy && Array.isArray(post.metadata.likedBy)) {
                // Fallback: count the likedBy array length
                likes = post.metadata.likedBy.length;
            }
            else if (post.likes !== undefined && post.likes !== null) {
                // Legacy fallback: check root-level likes
                if (Array.isArray(post.likes)) {
                    likes = post.likes.length;
                }
                else if (typeof post.likes === 'number') {
                    likes = post.likes;
                }
            }
            else if (post.likeCount !== undefined && post.likeCount !== null) {
                likes = typeof post.likeCount === 'number' ? post.likeCount : 0;
            }
            // Check if user has liked this post (only if userId is provided)
            let isLiked = false;
            if (userId && post.metadata && post.metadata.likedBy && Array.isArray(post.metadata.likedBy)) {
                isLiked = post.metadata.likedBy.includes(userId);
            }
            return {
                postId: post._id?.toString() || null,
                author: post.username || post.author || post.postedBy || post.createdBy || 'Anonymous',
                content: post.message || post.content || post.text || '',
                timestamp: post.timestamp || post.createdAt || post.date || new Date().toISOString(),
                likes: likes,
                isLiked: isLiked, // Add this field
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
/**
 * GET /api/public/forum-posts/verify-user
 * Verifies if an email is on the waitlist or approved, returns userId
 * Query params:
 *   - email: user's email address
 */
router.get('/public/forum-posts/verify-user', async (req, res) => {
    try {
        const email = String(req.query.email || '').toLowerCase().trim();
        if (!email || !(0, validator_1.isEmail)(email)) {
            return res.status(400).json({
                success: false,
                message: 'Valid email is required',
            });
        }
        // Check if user exists in splash page database
        const user = await User_1.default.findOne({ email }).lean().exec();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Email not found on waitlist. Please sign up first.',
            });
        }
        // User exists - return userId (they can post whether approved or on waitlist)
        return res.status(200).json({
            success: true,
            userId: user.userId,
            email: user.email,
            isApproved: user.isApproved,
            hasProAccess: user.hasProAccess,
        });
    }
    catch (error) {
        console.error('Error verifying user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify user',
        });
    }
});
/**
 * GET /api/public/forum-posts/check-status
 * Checks if a user can post (hasn't posted yet, or has 1 post they can manage)
 * Query params:
 *   - userId: user's userId
 */
router.get('/public/forum-posts/check-status', async (req, res) => {
    try {
        const userId = String(req.query.userId || '').trim();
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }
        if (!process.env.MONGODB_URI_WINGMAN) {
            return res.status(500).json({
                success: false,
                message: 'Database configuration error',
            });
        }
        const wingmanDB = await (0, databaseConnections_1.connectToWingmanDB)();
        const db = wingmanDB.db;
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Failed to connect to database',
            });
        }
        const forumsCollection = db.collection('forums');
        const forum = await forumsCollection.findOne({ forumId: SPLASH_PAGE_FORUM_ID });
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found',
            });
        }
        const posts = forum.posts || [];
        // Find user's post(s) - check createdBy field (which should be userId)
        const userPost = posts.find((post) => post.createdBy === userId);
        if (userPost) {
            // User has a post - return it so they can edit/delete
            return res.status(200).json({
                success: true,
                canPost: false,
                hasPost: true,
                postId: userPost._id?.toString(),
                post: {
                    content: userPost.message || userPost.content || '',
                    timestamp: userPost.timestamp || userPost.createdAt,
                },
            });
        }
        // User doesn't have a post - they can create one
        return res.status(200).json({
            success: true,
            canPost: true,
            hasPost: false,
        });
    }
    catch (error) {
        console.error('Error checking post status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check post status',
        });
    }
});
/**
 * POST /api/public/forum-posts
 * Creates a new post in the forum
 * Body:
 *   - userId: user's userId
 *   - content: post content/message
 */
router.post('/public/forum-posts', async (req, res) => {
    try {
        const { userId, content } = req.body;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Post content is required',
            });
        }
        // Verify user exists
        const user = await User_1.default.findOne({ userId }).lean().exec();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        if (!process.env.MONGODB_URI_WINGMAN) {
            return res.status(500).json({
                success: false,
                message: 'Database configuration error',
            });
        }
        const wingmanDB = await (0, databaseConnections_1.connectToWingmanDB)();
        const db = wingmanDB.db;
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Failed to connect to database',
            });
        }
        const forumsCollection = db.collection('forums');
        const forum = await forumsCollection.findOne({ forumId: SPLASH_PAGE_FORUM_ID });
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found',
            });
        }
        // Check if user already has a post
        const posts = forum.posts || [];
        const existingPost = posts.find((post) => post.createdBy === userId);
        if (existingPost) {
            return res.status(400).json({
                success: false,
                message: 'You already have a post. Please edit or delete it first.',
                postId: existingPost._id?.toString(),
            });
        }
        // Create new post object
        const newPost = {
            _id: new mongodb_1.ObjectId(),
            username: user.email, // Use email as username for splash page users
            message: content.trim(),
            timestamp: new Date(),
            createdBy: userId,
            metadata: {
                edited: false,
                likes: 0,
                likedBy: [],
                attachments: [],
                status: 'active',
            },
        };
        // Add post to forum's posts array
        const result = await forumsCollection.updateOne({ forumId: SPLASH_PAGE_FORUM_ID }, {
            $push: { posts: newPost },
            $set: {
                'metadata.totalPosts': posts.length + 1,
                'metadata.lastActivityAt': new Date(),
                updatedAt: new Date(),
            },
        });
        if (result.modifiedCount === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create post',
            });
        }
        return res.status(201).json({
            success: true,
            message: 'Post created successfully',
            postId: newPost._id.toString(),
            post: {
                author: user.email,
                content: newPost.message,
                timestamp: newPost.timestamp,
                likes: 0,
            },
        });
    }
    catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create post',
        });
    }
});
/**
 * PUT /api/public/forum-posts/:postId
 * Updates an existing post
 * Params:
 *   - postId: MongoDB ObjectId of the post
 * Body:
 *   - userId: user's userId (for verification)
 *   - content: updated post content
 */
router.put('/public/forum-posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, content } = req.body;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Post content is required',
            });
        }
        if (!mongodb_1.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid post ID',
            });
        }
        if (!process.env.MONGODB_URI_WINGMAN) {
            return res.status(500).json({
                success: false,
                message: 'Database configuration error',
            });
        }
        const wingmanDB = await (0, databaseConnections_1.connectToWingmanDB)();
        const db = wingmanDB.db;
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Failed to connect to database',
            });
        }
        const forumsCollection = db.collection('forums');
        const forum = await forumsCollection.findOne({ forumId: SPLASH_PAGE_FORUM_ID });
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found',
            });
        }
        const posts = forum.posts || [];
        const postIndex = posts.findIndex((post) => post._id?.toString() === postId && post.createdBy === userId);
        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Post not found or you do not have permission to edit it',
            });
        }
        // Update the post
        const updatePath = `posts.${postIndex}.message`;
        const metadataPath = `posts.${postIndex}.metadata.edited`;
        const result = await forumsCollection.updateOne({ forumId: SPLASH_PAGE_FORUM_ID }, {
            $set: {
                [updatePath]: content.trim(),
                [metadataPath]: true,
                updatedAt: new Date(),
            },
        });
        if (result.modifiedCount === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update post',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Post updated successfully',
            postId: postId,
        });
    }
    catch (error) {
        console.error('Error updating post:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update post',
        });
    }
});
/**
 * DELETE /api/public/forum-posts/:postId
 * Deletes a post
 * Params:
 *   - postId: MongoDB ObjectId of the post
 * Body:
 *   - userId: user's userId (for verification)
 */
router.delete('/public/forum-posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }
        if (!mongodb_1.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid post ID',
            });
        }
        if (!process.env.MONGODB_URI_WINGMAN) {
            return res.status(500).json({
                success: false,
                message: 'Database configuration error',
            });
        }
        const wingmanDB = await (0, databaseConnections_1.connectToWingmanDB)();
        const db = wingmanDB.db;
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Failed to connect to database',
            });
        }
        const forumsCollection = db.collection('forums');
        const forum = await forumsCollection.findOne({ forumId: SPLASH_PAGE_FORUM_ID });
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found',
            });
        }
        const posts = forum.posts || [];
        const post = posts.find((post) => post._id?.toString() === postId && post.createdBy === userId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found or you do not have permission to delete it',
            });
        }
        // Remove the post from the array
        const result = await forumsCollection.updateOne({ forumId: SPLASH_PAGE_FORUM_ID }, {
            $pull: { posts: { _id: new mongodb_1.ObjectId(postId) } },
            $set: {
                'metadata.totalPosts': Math.max(0, posts.length - 1),
                updatedAt: new Date(),
            },
        });
        if (result.modifiedCount === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete post',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Post deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete post',
        });
    }
});
/**
 * POST /api/public/forum-posts/:postId/like
 * Toggles like on a post (likes if not liked, unlikes if already liked)
 * Params:
 *   - postId: MongoDB ObjectId of the post
 * Body:
 *   - userId: user's userId (for verification)
 */
router.post('/public/forum-posts/:postId/like', async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }
        if (!mongodb_1.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid post ID',
            });
        }
        if (!process.env.MONGODB_URI_WINGMAN) {
            return res.status(500).json({
                success: false,
                message: 'Database configuration error',
            });
        }
        const wingmanDB = await (0, databaseConnections_1.connectToWingmanDB)();
        const db = wingmanDB.db;
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Failed to connect to database',
            });
        }
        const forumsCollection = db.collection('forums');
        const forum = await forumsCollection.findOne({ forumId: SPLASH_PAGE_FORUM_ID });
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found',
            });
        }
        const posts = forum.posts || [];
        const postIndex = posts.findIndex((post) => post._id?.toString() === postId);
        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }
        const post = posts[postIndex];
        const metadata = post.metadata || {};
        const likedBy = metadata.likedBy || [];
        const currentLikes = typeof metadata.likes === 'number' ? metadata.likes : likedBy.length;
        // Check if user has already liked this post
        const hasLiked = Array.isArray(likedBy) && likedBy.includes(userId);
        let newLikedBy;
        let newLikesCount;
        if (hasLiked) {
            // Unlike: remove userId from array
            newLikedBy = likedBy.filter((id) => id !== userId);
            newLikesCount = Math.max(0, currentLikes - 1);
        }
        else {
            // Like: add userId to array
            newLikedBy = [...likedBy, userId];
            newLikesCount = currentLikes + 1;
        }
        // Update the post's metadata
        const likesPath = `posts.${postIndex}.metadata.likes`;
        const likedByPath = `posts.${postIndex}.metadata.likedBy`;
        const result = await forumsCollection.updateOne({ forumId: SPLASH_PAGE_FORUM_ID }, {
            $set: {
                [likesPath]: newLikesCount,
                [likedByPath]: newLikedBy,
                updatedAt: new Date(),
            },
        });
        if (result.modifiedCount === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update like',
            });
        }
        return res.status(200).json({
            success: true,
            liked: !hasLiked, // true if just liked, false if just unliked
            likes: newLikesCount,
            message: hasLiked ? 'Post unliked successfully' : 'Post liked successfully',
        });
    }
    catch (error) {
        console.error('Error toggling like:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle like',
        });
    }
});
exports.default = router;

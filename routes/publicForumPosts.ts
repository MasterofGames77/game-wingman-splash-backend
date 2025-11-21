import { Request, Response, Router } from 'express';
import { connectToWingmanDB } from '../utils/databaseConnections';
import User from '../models/User';
import { isEmail } from 'validator';
import { ObjectId } from 'mongodb';
import { checkContentModeration } from '../utils/contentModeration';

const router = Router();

// Available forums to showcase on splash page
const SPLASH_PAGE_FORUMS = {
  xenoblade: {
    forumId: "forum_1760222601584_k4k6xncld",
    title: "Favorite Hero in Xenoblade Chronicles 3",
    gameTitle: "Xenoblade Chronicles 3",
  },
  eldenring: {
    forumId: "forum_1763681917979_3qgttdvtr",
    title: "Elden Ring Lore",
    gameTitle: "Elden Ring",
  },
  apexlegends: {
    forumId: "forum_1763236973075_bxzzix94i",
    title: "Apex Legends",
    gameTitle: "Apex Legends",
  },
};

// Default forum (Xenoblade Chronicles 3) for backward compatibility
const DEFAULT_FORUM_ID = SPLASH_PAGE_FORUMS.xenoblade.forumId;

/**
 * Helper function to get and validate forum ID from request
 * Checks query params first, then body, then defaults to Xenoblade forum
 */
function getForumId(req: Request): string {
  // Try query parameter first
  const forumIdFromQuery = String(req.query.forumId || '').trim();
  if (forumIdFromQuery) {
    // Validate it's one of our allowed forums
    const isValid = Object.values(SPLASH_PAGE_FORUMS).some(
      forum => forum.forumId === forumIdFromQuery
    );
    if (isValid) {
      return forumIdFromQuery;
    }
  }

  // Try body parameter (for POST/PUT/DELETE requests)
  const forumIdFromBody = req.body?.forumId;
  if (forumIdFromBody && typeof forumIdFromBody === 'string') {
    const trimmed = forumIdFromBody.trim();
    const isValid = Object.values(SPLASH_PAGE_FORUMS).some(
      forum => forum.forumId === trimmed
    );
    if (isValid) {
      return trimmed;
    }
  }

  // Default to Xenoblade forum for backward compatibility
  return DEFAULT_FORUM_ID;
}

/**
 * GET /api/public/forum-posts
 * Returns posts from a specific forum for preview on the splash page
 * Query params:
 *   - forumId: (optional) forum ID to view (defaults to Xenoblade Chronicles 3 forum)
 *   - limit: number of posts to return (default: 1, max: 1 - loads one at a time)
 *   - offset: number of posts to skip (default: 0) - for pagination
 *   - userId: (optional) user's userId to check if they've liked each post
 * 
 * Usage:
 *   - Initial load: GET /api/public/forum-posts?limit=1&offset=0 (loads 1st post from default forum)
 *   - With forum selection: GET /api/public/forum-posts?forumId=forum_xxx&limit=1&offset=0
 *   - With user context: GET /api/public/forum-posts?limit=1&offset=0&userId=user-xxx (includes isLiked field)
 *   - Load more: GET /api/public/forum-posts?limit=1&offset=1&userId=user-xxx (loads 2nd post)
 *   - etc.
 */
router.get('/public/forum-posts', async (req: Request, res: Response) => {
  try {
    // Get forum ID from query params (with validation and default)
    const forumId = getForumId(req);

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

    const wingmanDB = await connectToWingmanDB();
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
    const forum = await forumsCollection.findOne(
      { forumId: forumId },
      {
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
      }
    );

    if (!forum) {
      // Debug logging only in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Forum not found by forumId:', forumId);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Forum not found for preview',
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            searchedForumId: forumId,
          }
        })
      });
    }

    // Extract posts array from forum document
    const allPosts = forum.posts || [];
    
    // Sort posts by timestamp (if available) or keep original order
    // Posts should be sorted chronologically (newest first) so new posts from splash page appear at the top
    const sortedPosts = [...allPosts].sort((a: any, b: any) => {
      const timeA = a.timestamp || a.createdAt || a.date || 0;
      const timeB = b.timestamp || b.createdAt || b.date || 0;
      return timeB - timeA; // Descending order (newest first)
    });

    // Apply pagination: slice posts array based on offset and limit
    const paginatedPosts = sortedPosts.slice(offset, offset + limit);

    // Transform posts to ensure consistent response format
    const previewPosts = paginatedPosts.map((post: any) => {
      // Extract likes from metadata.likes (primary) or count metadata.likedBy array (fallback)
      let likes = 0;
      if (post.metadata && post.metadata.likes !== undefined && post.metadata.likes !== null) {
        // Primary: likes stored as number in metadata.likes
        likes = typeof post.metadata.likes === 'number' ? post.metadata.likes : 0;
      } else if (post.metadata && post.metadata.likedBy && Array.isArray(post.metadata.likedBy)) {
        // Fallback: count the likedBy array length
        likes = post.metadata.likedBy.length;
      } else if (post.likes !== undefined && post.likes !== null) {
        // Legacy fallback: check root-level likes
        if (Array.isArray(post.likes)) {
          likes = post.likes.length;
        } else if (typeof post.likes === 'number') {
          likes = post.likes;
        }
      } else if (post.likeCount !== undefined && post.likeCount !== null) {
        likes = typeof post.likeCount === 'number' ? post.likeCount : 0;
      }

      // Check if user has liked this post (only if userId is provided)
      let isLiked = false;
      if (userId && post.metadata && post.metadata.likedBy && Array.isArray(post.metadata.likedBy)) {
        isLiked = post.metadata.likedBy.includes(userId);
      }
      
      // Extract attachments from metadata.attachments
      const attachments = (post.metadata && post.metadata.attachments && Array.isArray(post.metadata.attachments))
        ? post.metadata.attachments
        : [];
      
      // Extract edited status and timestamp
      const isEdited = post.metadata && post.metadata.edited === true;
      const editedAt = post.metadata && post.metadata.editedAt 
        ? post.metadata.editedAt 
        : (post.metadata && post.metadata.lastEdited 
          ? post.metadata.lastEdited 
          : null);
      
      return {
        postId: post._id?.toString() || null,
        author: post.username || post.author || post.postedBy || post.createdBy || 'Anonymous',
        content: post.message || post.content || post.text || '',
        timestamp: post.timestamp || post.createdAt || post.date || new Date().toISOString(),
        likes: likes,
        isLiked: isLiked, // Add this field
        attachments: attachments, // Include image attachments
        edited: isEdited, // Whether the post has been edited
        editedAt: editedAt, // Timestamp when the post was last edited (null if never edited)
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
  } catch (error) {
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
 * GET /api/public/forum-posts/available-forums
 * Returns list of available forums for the splash page
 */
router.get('/public/forum-posts/available-forums', async (req: Request, res: Response) => {
  try {
    const forums = Object.values(SPLASH_PAGE_FORUMS).map(forum => ({
      forumId: forum.forumId,
      title: forum.title,
      gameTitle: forum.gameTitle,
    }));

    return res.status(200).json({
      success: true,
      forums: forums,
      defaultForumId: DEFAULT_FORUM_ID,
    });
  } catch (error) {
    console.error('Error fetching available forums:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch available forums',
    });
  }
});

/**
 * GET /api/public/forum-posts/verify-user
 * Verifies if an email is on the waitlist or approved, returns userId
 * Query params:
 *   - email: user's email address
 */
router.get('/public/forum-posts/verify-user', async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || '').toLowerCase().trim();

    if (!email || !isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required',
      });
    }

    // Check if user exists in splash page database
    const user = await User.findOne({ email }).lean().exec() as any;

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
  } catch (error) {
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
 *   - forumId: (optional) forum ID to check (defaults to Xenoblade Chronicles 3 forum)
 *   - userId: user's userId
 */
router.get('/public/forum-posts/check-status', async (req: Request, res: Response) => {
  try {
    // Get forum ID from query params (with validation and default)
    const forumId = getForumId(req);

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

    const wingmanDB = await connectToWingmanDB();
    const db = wingmanDB.db;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to database',
      });
    }

    const forumsCollection = db.collection('forums');
    const forum = await forumsCollection.findOne({ forumId: forumId });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found',
      });
    }

    const posts = forum.posts || [];
    // Find user's post(s) - check createdBy field (which should be userId)
    const userPost = posts.find((post: any) => post.createdBy === userId);

    if (userPost) {
      // User has a post - return it so they can edit/delete
      const attachments = (userPost.metadata && userPost.metadata.attachments && Array.isArray(userPost.metadata.attachments))
        ? userPost.metadata.attachments
        : [];
      
      // Extract edited status and timestamp
      const isEdited = userPost.metadata && userPost.metadata.edited === true;
      const editedAt = userPost.metadata && userPost.metadata.editedAt 
        ? userPost.metadata.editedAt 
        : (userPost.metadata && userPost.metadata.lastEdited 
          ? userPost.metadata.lastEdited 
          : null);
      
      return res.status(200).json({
        success: true,
        canPost: false,
        hasPost: true,
        postId: userPost._id?.toString(),
        post: {
          content: userPost.message || userPost.content || '',
          timestamp: userPost.timestamp || userPost.createdAt,
          attachments: attachments,
          edited: isEdited,
          editedAt: editedAt,
        },
      });
    }

    // User doesn't have a post - they can create one
    return res.status(200).json({
      success: true,
      canPost: true,
      hasPost: false,
    });
  } catch (error) {
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
 *   - forumId: (optional) forum ID to post to (defaults to Xenoblade Chronicles 3 forum)
 *   - userId: user's userId
 *   - content: post content/message
 *   - attachments: array of image attachment objects (optional)
 *     Each attachment should have: { url, name, size, type }
 */
router.post('/public/forum-posts', async (req: Request, res: Response) => {
  try {
    // Get forum ID from body (with validation and default)
    const forumId = getForumId(req);
    const { userId, content, attachments } = req.body;

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

    // Validate attachments if provided
    let validatedAttachments: any[] = [];
    if (attachments) {
      if (!Array.isArray(attachments)) {
        return res.status(400).json({
          success: false,
          message: 'Attachments must be an array',
        });
      }

      // Splash page users can only have 1 image
      if (attachments.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'Splash page users can only upload 1 image per post',
        });
      }

      // Validate each attachment
      for (const attachment of attachments) {
        if (!attachment.url || typeof attachment.url !== 'string') {
          return res.status(400).json({
            success: false,
            message: 'Each attachment must have a valid URL',
          });
        }

        // Basic URL validation
        try {
          new URL(attachment.url);
        } catch {
          return res.status(400).json({
            success: false,
            message: 'Invalid attachment URL format',
          });
        }

        validatedAttachments.push({
          url: attachment.url,
          name: attachment.name || 'image',
          size: attachment.size || 0,
          type: attachment.type || 'image/jpeg',
        });
      }
    }

    // Check content moderation
    const moderationResult = await checkContentModeration(content);
    if (!moderationResult.isSafe) {
      return res.status(400).json({
        success: false,
        message: moderationResult.message || 'Your post contains inappropriate content. Please remove any offensive words or phrases and try again.',
        detectedWords: moderationResult.detectedWords,
        moderationWarning: true,
      });
    }

    // Verify user exists
    const user = await User.findOne({ userId }).lean().exec() as any;
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

    const wingmanDB = await connectToWingmanDB();
    const db = wingmanDB.db;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to database',
      });
    }

    const forumsCollection = db.collection('forums');
    const forum = await forumsCollection.findOne({ forumId: forumId });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found',
      });
    }

    // Check if user already has a post
    const posts = forum.posts || [];
    const existingPost = posts.find((post: any) => post.createdBy === userId);

    if (existingPost) {
      return res.status(400).json({
        success: false,
        message: 'You already have a post. Please edit or delete it first.',
        postId: existingPost._id?.toString(),
      });
    }

    // Create new post object
    const newPost = {
      _id: new ObjectId(),
      username: user.email, // Use email as username for splash page users
      message: content.trim(),
      timestamp: new Date(),
      createdBy: userId,
      metadata: {
        edited: false,
        likes: 0,
        likedBy: [],
        attachments: validatedAttachments, // Store validated attachments
        status: 'active',
      },
    };

    // Add post to forum's posts array
    const result = await forumsCollection.updateOne(
      { forumId: forumId },
      {
        $push: { posts: newPost as any },
        $set: {
          'metadata.totalPosts': posts.length + 1,
          'metadata.lastActivityAt': new Date(),
          updatedAt: new Date(),
        },
      }
    );

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
        attachments: validatedAttachments,
      },
    });
  } catch (error) {
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
 *   - forumId: (optional) forum ID where the post exists (defaults to Xenoblade Chronicles 3 forum)
 *   - userId: user's userId (for verification)
 *   - content: updated post content
 *   - attachments: array of image attachment objects (optional)
 *     Each attachment should have: { url, name, size, type }
 */
router.put('/public/forum-posts/:postId', async (req: Request, res: Response) => {
  try {
    // Get forum ID from body (with validation and default)
    const forumId = getForumId(req);
    const { postId } = req.params;
    const { userId, content, attachments } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    // Allow empty message if attachments are provided (like social media posts)
    // But also allow message + attachments together (normal case)
    const hasMessage = content && typeof content === 'string' && content.trim().length > 0;
    const hasAttachments = attachments && Array.isArray(attachments) && attachments.length > 0;

    if (!hasMessage && !hasAttachments) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required, or you must provide at least one image',
      });
    }

    // Validate message length if provided
    if (content && content.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Post content too long (max 5000 characters)',
      });
    }

    // Validate attachments if provided
    let validatedAttachments: any[] = [];
    if (attachments !== undefined) {
      if (!Array.isArray(attachments)) {
        return res.status(400).json({
          success: false,
          message: 'Attachments must be an array',
        });
      }

      // Splash page users can only have 1 image
      if (attachments.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'Splash page users can only upload 1 image per post',
        });
      }

      // Validate each attachment structure (matching main app validation)
      for (const attachment of attachments) {
        if (!attachment.type || !attachment.url) {
          return res.status(400).json({
            success: false,
            message: 'Invalid attachment format. Each attachment must have type and url',
          });
        }

        if (attachment.type !== 'image') {
          return res.status(400).json({
            success: false,
            message: 'Only image attachments are currently supported',
          });
        }

        // Basic URL validation (matching main app)
        const isValidUrl = 
          attachment.url.startsWith('/uploads/forum-images/') ||
          attachment.url.startsWith('/uploads/automated-images/') ||
          attachment.url.startsWith('http://') ||
          attachment.url.startsWith('https://');

        if (!isValidUrl) {
          return res.status(400).json({
            success: false,
            message: 'Invalid image URL. Images must be uploaded through the upload endpoint or be a valid cloud URL.',
          });
        }

        validatedAttachments.push({
          type: 'image',
          url: attachment.url,
          name: attachment.name || 'image',
          size: attachment.size || 0,
        });
      }
    }

    // Check content moderation (only if message is provided)
    if (hasMessage) {
      const moderationResult = await checkContentModeration(content);
      if (!moderationResult.isSafe) {
        return res.status(400).json({
          success: false,
          message: moderationResult.message || 'Your post contains inappropriate content. Please remove any offensive words or phrases and try again.',
          detectedWords: moderationResult.detectedWords,
          moderationWarning: true,
        });
      }
    }

    if (!ObjectId.isValid(postId)) {
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

    const wingmanDB = await connectToWingmanDB();
    const db = wingmanDB.db;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to database',
      });
    }

    const forumsCollection = db.collection('forums');
    const forum = await forumsCollection.findOne({ forumId: forumId });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found',
      });
    }

    const posts = forum.posts || [];
    const postIndex = posts.findIndex(
      (post: any) => post._id?.toString() === postId && post.createdBy === userId
    );

    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you do not have permission to edit it',
      });
    }

    // Update the post using positional operator ($) to update only the specific post
    const updateFields: any = {
      [`posts.${postIndex}.metadata.edited`]: true,
      [`posts.${postIndex}.metadata.editedAt`]: new Date(),
      [`posts.${postIndex}.metadata.editedBy`]: userId,
      updatedAt: new Date(),
    };

    // Always update message if provided (preserve existing message when adding images)
    // If message is provided (even if empty string), update it to preserve user's intent
    if (content !== undefined && typeof content === 'string') {
      updateFields[`posts.${postIndex}.message`] = content.trim();
    }

    // Update attachments if provided (allows removing images by sending empty array)
    if (attachments !== undefined) {
      updateFields[`posts.${postIndex}.metadata.attachments`] = validatedAttachments;
    }

    // Use findOneAndUpdate with positional operator to update only the specific post
    const result = await forumsCollection.updateOne(
      { 
        forumId: forumId,
        'posts._id': new ObjectId(postId)
      },
      {
        $set: updateFields,
      }
    );

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
  } catch (error) {
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
 *   - forumId: (optional) forum ID where the post exists (defaults to Xenoblade Chronicles 3 forum)
 *   - userId: user's userId (for verification)
 */
router.delete('/public/forum-posts/:postId', async (req: Request, res: Response) => {
  try {
    // Get forum ID from body (with validation and default)
    const forumId = getForumId(req);
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    if (!ObjectId.isValid(postId)) {
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

    const wingmanDB = await connectToWingmanDB();
    const db = wingmanDB.db;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to database',
      });
    }

    const forumsCollection = db.collection('forums');
    const forum = await forumsCollection.findOne({ forumId: forumId });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found',
      });
    }

    const posts = forum.posts || [];
    const post = posts.find(
      (post: any) => post._id?.toString() === postId && post.createdBy === userId
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you do not have permission to delete it',
      });
    }

    // Remove the post from the array
    const result = await forumsCollection.updateOne(
      { forumId: forumId },
      {
        $pull: { posts: { _id: new ObjectId(postId) } } as any,
        $set: {
          'metadata.totalPosts': Math.max(0, posts.length - 1),
          updatedAt: new Date(),
        },
      }
    );

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
  } catch (error) {
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
 *   - forumId: (optional) forum ID where the post exists (defaults to Xenoblade Chronicles 3 forum)
 *   - userId: user's userId (for verification)
 */
router.post('/public/forum-posts/:postId/like', async (req: Request, res: Response) => {
  try {
    // Get forum ID from body (with validation and default)
    const forumId = getForumId(req);
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    if (!ObjectId.isValid(postId)) {
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

    const wingmanDB = await connectToWingmanDB();
    const db = wingmanDB.db;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to database',
      });
    }

    const forumsCollection = db.collection('forums');
    const forum = await forumsCollection.findOne({ forumId: forumId });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found',
      });
    }

    const posts = forum.posts || [];
    const postIndex = posts.findIndex((post: any) => post._id?.toString() === postId);

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
    
    let newLikedBy: string[];
    let newLikesCount: number;

    if (hasLiked) {
      // Unlike: remove userId from array
      newLikedBy = likedBy.filter((id: string) => id !== userId);
      newLikesCount = Math.max(0, currentLikes - 1);
    } else {
      // Like: add userId to array
      newLikedBy = [...likedBy, userId];
      newLikesCount = currentLikes + 1;
    }

    // Update the post's metadata
    const likesPath = `posts.${postIndex}.metadata.likes`;
    const likedByPath = `posts.${postIndex}.metadata.likedBy`;

    const result = await forumsCollection.updateOne(
      { forumId: forumId },
      {
        $set: {
          [likesPath]: newLikesCount,
          [likedByPath]: newLikedBy,
          updatedAt: new Date(),
        },
      }
    );

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
  } catch (error) {
    console.error('Error toggling like:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
    });
  }
});

export default router;

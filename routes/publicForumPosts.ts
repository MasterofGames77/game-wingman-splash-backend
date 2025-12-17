import { Request, Response, Router } from 'express';
import { connectToWingmanDB } from '../utils/databaseConnections';
import User from '../models/User';
import { isEmail } from 'validator';
import { ObjectId } from 'mongodb';
import { checkContentModeration } from '../utils/contentModeration';
import { cachePresets, addETag } from '../utils/cacheHeaders';

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
    title: "General Discussion",
    gameTitle: "Apex Legends",
  },
  celeste: {
    forumId: "forum_1763160209962_x5ytzwz3a",
    title: "Gameplay",
    gameTitle: "Celeste",
  },
  JakandDaxter: {
    forumId: "forum_1763236935768_ih7j3ioea",
    title: "General Discussion",
    gameTitle: "Jak and Daxter: The Precursor Legacy",
  },
  thelastofus: {
    forumId: "forum_1765151756260_f3rhf8xjs",
    title: "Gameplay",
    gameTitle: "The Last of Us",
  },
  candycrush: {
    forumId: "forum_1765150805927_hbtm3cuz6",
    title: "General Discussion",
    gameTitle: "Candy Crush Saga",
  },
  twopointmuseum: {
    forumId: "forum_1765218600020_esp7qcn89",
    title: "General Discussion",
    gameTitle: "Two Point Museum",
  },
  persona5royal: {
    forumId: "forum_1765151949973_n6p0x4jtl",
    title: "Help & Support",
    gameTitle: "Persona 5 Royal",
  },
  supermario64: {
    forumId: "forum_1748480234269_p7s8uq6wy",
    title: "Speedruns",
    gameTitle: "Super Mario 64",
  },
  populationone: {
    forumId: "forum_1765116000030_1b7qw0ezu",
    title: "Mods",
    gameTitle: "Population: ONE",
  },
  cyberpunk2077: {
    forumId: "forum_1765226700037_obd4h66av",
    title: "General Discussion",
    gameTitle: "Cyberpunk 2077",
  },
  guiltygearstrive: {
    forumId: "forum_1765371600044_lyloigfr7",
    title: "Speedruns",
    gameTitle: "Guilty Gear Strive",
  },
  portal2: {
    forumId: "forum_1765305000024_to7wisorn",
    title: "General Discussion",
    gameTitle: "Portal 2"
  },
  storyofseasons: {
    forumId: "forum_1765303200021_nncbl3kw2",
    title: "General Discussion",
    gameTitle: "Story of Seasons",
  },
  fzerogx: {
    forumId: "forum_1765303202811_k6sdc8fsb",
    title: "Gameplay",
    gameTitle: "F-Zero GX",
  }
};

// Default forum (Xenoblade Chronicles 3) for backward compatibility
const DEFAULT_FORUM_ID = SPLASH_PAGE_FORUMS.xenoblade.forumId;

/**
 * Helper function to connect to Wingman database with proper error handling
 * Returns the database object or throws an error
 */
async function getWingmanDatabase(): Promise<any> {
  if (!process.env.MONGODB_URI_WINGMAN) {
    throw new Error('Database configuration error: MONGODB_URI_WINGMAN not set');
  }

  let wingmanDB;
  try {
    wingmanDB = await connectToWingmanDB();
  } catch (dbError) {
    console.error('Database connection error:', dbError);
    throw new Error(`Failed to connect to database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
  }

  // Check if connection is usable
  // Mongoose readyState values:
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (!wingmanDB) {
    console.error('Database connection object is not available');
    throw new Error('Database connection not available');
  }

  // Treat fully disconnected connections as an error, but allow "connecting" (2)
  // since the Mongo driver will queue operations until ready.
  if (wingmanDB.readyState === 0) {
    console.error('Database connection is disconnected. State:', wingmanDB.readyState);
    throw new Error('Database connection is disconnected');
  }

  // Access database - mongoose.Connection has .db property
  const db = (wingmanDB as any).db || wingmanDB;

  if (!db) {
    console.error('Database object not available');
    throw new Error('Failed to access database');
  }

  return db;
}

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
 * Helper function to convert timestamp to number (milliseconds since epoch)
 */
function getTimestampValue(post: any): number {
  const timestamp = post.timestamp || post.createdAt || post.date;
  if (!timestamp) return 0;
  
  // If it's already a Date object, get time value
  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }
  
  // If it's a number, assume it's already milliseconds
  if (typeof timestamp === 'number') {
    return timestamp;
  }
  
  // If it's a string, try to parse it as ISO date
  if (typeof timestamp === 'string') {
    const parsed = new Date(timestamp);
    return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }
  
  return 0;
}

/**
 * Interface for posts with forum metadata
 */
interface PostWithForum {
  post: any;
  forumId: string;
  gameTitle: string;
  forumTitle: string;
  category?: string;
}

/**
 * Fetches all posts from all splash page forums
 * @param db - Database connection
 * @param gameTitle - Optional game title to filter by
 * @returns Array of posts with forum metadata
 */
async function getAllSplashPagePosts(db: any, gameTitle?: string): Promise<PostWithForum[]> {
  const forumsCollection = db.collection('forums');
  const allPostsWithForum: PostWithForum[] = [];
  
  // Get all forum IDs from SPLASH_PAGE_FORUMS
  const forumIds = Object.values(SPLASH_PAGE_FORUMS).map(f => f.forumId);
  
  if (!forumIds || forumIds.length === 0) {
    console.warn('No forum IDs found in SPLASH_PAGE_FORUMS');
    return [];
  }
  
  // Build query - filter by forumId and optionally by gameTitle
  const query: any = { forumId: { $in: forumIds } };
  
  // Fetch all forums
  let forums;
  try {
    forums = await forumsCollection.find(query, {
      projection: {
        _id: 0,
        forumId: 1,
        gameTitle: 1,
        title: 1,
        category: 1,
        posts: 1,
      }
    }).toArray();
  } catch (queryError) {
    const errorMessage = queryError instanceof Error ? queryError.message : 'Unknown error';
    console.error('Database query error in getAllSplashPagePosts:', errorMessage);
    console.error('Query:', JSON.stringify(query, null, 2));
    throw new Error(`Database query failed: ${errorMessage}`);
  }
  
  if (!forums || forums.length === 0) {
    console.warn('No forums found matching query:', JSON.stringify(query, null, 2));
    return [];
  }
  
  // Process each forum
  for (const forum of forums) {
    // Apply game title filter if provided (case-insensitive, trimmed)
    if (gameTitle) {
      const forumGameTitle = (forum.gameTitle || '').trim();
      const filterGameTitle = gameTitle.trim();
      if (forumGameTitle.toLowerCase() !== filterGameTitle.toLowerCase()) {
        continue;
      }
    }
    
    // Find matching splash forum config for title format
    const splashForum = Object.values(SPLASH_PAGE_FORUMS).find(
      f => f.forumId === forum.forumId
    );
    
    const forumTitle = splashForum 
      ? `${splashForum.gameTitle} - ${splashForum.title}`
      : (forum.gameTitle && forum.title 
        ? `${forum.gameTitle} - ${forum.title}` 
        : forum.title || 'Untitled Forum');
    
    const posts = forum.posts || [];
    
    // Add each post with forum metadata
    for (const post of posts) {
      allPostsWithForum.push({
        post,
        forumId: forum.forumId,
        gameTitle: forum.gameTitle || '',
        forumTitle,
        category: forum.category,
      });
    }
  }
  
  return allPostsWithForum;
}

/**
 * Transforms a post to the response format
 */
function transformPost(post: any, userId?: string): any {
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
  
  // Extract parentPostId (for replies)
  const parentPostId = post.parentPostId 
    ? (post.parentPostId instanceof ObjectId ? post.parentPostId.toString() : String(post.parentPostId))
    : null;
  
  return {
    postId: post._id?.toString() || null,
    author: post.username || post.author || post.postedBy || post.createdBy || 'Anonymous',
    content: post.message || post.content || post.text || '',
    timestamp: post.timestamp || post.createdAt || post.date || new Date().toISOString(),
    likes: likes,
    isLiked: isLiked,
    attachments: attachments,
    edited: isEdited,
    editedAt: editedAt,
    parentPostId: parentPostId,
    replies: [], // Will be populated by buildReplyTree
  };
}

/**
 * Validates that a parent post exists and returns its forum information
 * @param db - Database connection
 * @param parentPostId - The post ID to validate
 * @returns Object with forumId and parent post, or null if not found
 */
async function validateParentPost(db: any, parentPostId: string): Promise<{ forumId: string; parentPost: any } | null> {
  if (!ObjectId.isValid(parentPostId)) {
    return null;
  }

  const forumsCollection = db.collection('forums');
  
  // Search all splash page forums for the parent post
  const forumIds = Object.values(SPLASH_PAGE_FORUMS).map(f => f.forumId);
  const forums = await forumsCollection.find(
    { forumId: { $in: forumIds } },
    { projection: { forumId: 1, posts: 1 } }
  ).toArray();

  // Search through all forums to find the parent post
  for (const forum of forums) {
    const posts = forum.posts || [];
    const parentPost = posts.find((post: any) => {
      const postId = post._id?.toString();
      return postId === parentPostId;
    });

    if (parentPost) {
      return {
        forumId: forum.forumId,
        parentPost: parentPost,
      };
    }
  }

  return null;
}

/**
 * Builds a nested reply tree structure from flat post list
 * Separates top-level posts from replies and nests replies under their parents
 */
function buildReplyTree(postsWithForum: PostWithForum[], userId?: string): any[] {
  // Transform all posts to response format
  const allPosts = postsWithForum.map(({ post, forumId, gameTitle, forumTitle, category }) => {
    const transformed = transformPost(post, userId);
    transformed.forumId = forumId;
    transformed.gameTitle = gameTitle;
    transformed.forumTitle = forumTitle;
    if (category) {
      transformed.category = category;
    }
    return transformed;
  });
  
  // Separate top-level posts from replies
  const topLevelPosts: any[] = [];
  const repliesMap = new Map<string, any[]>(); // Map of parentPostId -> replies[]
  
  for (const post of allPosts) {
    // Check if this is a reply (has parentPostId)
    const parentId = post.parentPostId;
    
    if (parentId) {
      // This is a reply - add to replies map
      if (!repliesMap.has(parentId)) {
        repliesMap.set(parentId, []);
      }
      repliesMap.get(parentId)!.push(post);
    } else {
      // This is a top-level post
      topLevelPosts.push(post);
    }
  }
  
  // Sort replies by timestamp (newest first)
  for (const [parentId, replies] of repliesMap.entries()) {
    replies.sort((a, b) => {
      const timeA = getTimestampValue({ timestamp: a.timestamp });
      const timeB = getTimestampValue({ timestamp: b.timestamp });
      return timeB - timeA; // Newest first
    });
  }
  
  // Attach replies to their parent posts
  for (const post of topLevelPosts) {
    const postId = post.postId;
    if (postId && repliesMap.has(postId)) {
      post.replies = repliesMap.get(postId)!;
    } else {
      post.replies = [];
    }
  }
  
  // Sort top-level posts by timestamp (newest first)
  topLevelPosts.sort((a, b) => {
    const timeA = getTimestampValue({ timestamp: a.timestamp });
    const timeB = getTimestampValue({ timestamp: b.timestamp });
    
    // If timestamps are equal, use post ID as tiebreaker for stable sort
    if (timeB === timeA) {
      const idA = a.postId || '';
      const idB = b.postId || '';
      return idB.localeCompare(idA); // Descending order for IDs
    }
    
    return timeB - timeA; // Descending order (newest first)
  });
  
  return topLevelPosts;
}

/**
 * GET /api/public/forum-posts
 * Returns posts from all forums in a unified feed for the splash page
 * Query params:
 *   - gameTitle: (optional) Filter posts by game title (e.g., "Xenoblade Chronicles 3")
 *   - limit: number of posts to return (default: 50, max: 100)
 *   - offset: number of posts to skip (default: 0) - for pagination
 *   - userId: (optional) user's userId to check if they've liked each post
 * 
 * Usage:
 *   - Initial load: GET /api/public/forum-posts?limit=50 (loads 50 posts from all games)
 *   - With game filter: GET /api/public/forum-posts?gameTitle=Xenoblade%20Chronicles%203&limit=50
 *   - With user context: GET /api/public/forum-posts?limit=50&userId=user-xxx (includes isLiked field)
 *   - Load more: GET /api/public/forum-posts?limit=50&offset=50&userId=user-xxx
 */
router.get('/public/forum-posts', cachePresets.forumPosts, addETag, async (req: Request, res: Response) => {
  try {
    // Get userId from query params (optional)
    const userId = String(req.query.userId || '').trim();

    // Get gameTitle filter (optional)
    const gameTitle = String(req.query.gameTitle || '').trim() || undefined;

    // Parse and validate limit parameter
    const limitParam = req.query.limit;
    let limit = 50; // default: show 50 posts initially
    if (limitParam) {
      const parsedLimit = parseInt(String(limitParam), 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 100); // cap at 100
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
    let db;
    try {
      db = await getWingmanDatabase();
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('Database error in forum-posts:', errorMessage);
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }

    // Fetch all posts from all splash page forums
    let allPostsWithForum: PostWithForum[];
    try {
      allPostsWithForum = await getAllSplashPagePosts(db, gameTitle);
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      console.error('Error fetching posts from forums:', errorMessage);
      console.error('Error stack:', fetchError instanceof Error ? fetchError.stack : 'No stack trace');
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch posts from forums',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }

    // Deduplicate posts by _id to prevent showing the same post multiple times
    const seenPostIds = new Set<string>();
    const uniquePostsWithForum = allPostsWithForum.filter(({ post }) => {
      const postId = post._id?.toString();
      if (!postId) return true; // Keep posts without IDs (shouldn't happen, but be safe)
      if (seenPostIds.has(postId)) {
        return false; // Skip duplicate
      }
      seenPostIds.add(postId);
      return true;
    });

    // Build reply tree structure (nested replies under posts)
    const postsWithReplies = buildReplyTree(uniquePostsWithForum, userId || undefined);

    // Apply pagination: slice posts array based on offset and limit
    const paginatedPosts = postsWithReplies.slice(offset, offset + limit);

    // Get list of available games for filter
    const availableGames = Array.from(
      new Set(
        Object.values(SPLASH_PAGE_FORUMS).map(f => f.gameTitle)
      )
    ).sort();

    // Return unified feed with nested replies
    return res.status(200).json({
      success: true,
      posts: paginatedPosts,
      count: paginatedPosts.length,
      totalPosts: postsWithReplies.length,
      hasMore: offset + limit < postsWithReplies.length,
      availableGames: availableGames,
    });
  } catch (error) {
    console.error('Error fetching forum posts for preview:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch forum posts',
      // Include error details in development only
      ...(process.env.NODE_ENV === 'development' && { 
        error: errorMessage,
        stack: errorStack
      })
    });
  }
});

/**
 * GET /api/public/forum-posts/available-forums
 * Returns list of available forums for the splash page
 */
router.get('/public/forum-posts/available-forums', cachePresets.staticContent, addETag, async (req: Request, res: Response) => {
  try {
    const forums = Object.values(SPLASH_PAGE_FORUMS).map(forum => {
      const displayTitle = `${forum.gameTitle} - ${forum.title}`; // Format: "Game Title - Forum Title"
      return {
        forumId: forum.forumId,
        title: displayTitle, // Use displayTitle format for title field to ensure frontend gets correct format
        gameTitle: forum.gameTitle,
        displayTitle: displayTitle, // Also provide as separate field for explicit use
      };
    });

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
 * GET /api/public/forum-posts/available-games
 * Returns list of available games with post counts for filtering
 * Response includes:
 *   - gameTitle: Name of the game
 *   - forumCount: Number of forums for this game
 *   - postCount: Total number of top-level posts across all forums for this game
 */
router.get('/public/forum-posts/available-games', cachePresets.staticContent, addETag, async (req: Request, res: Response) => {
  try {
    // Connect to database
    let db;
    try {
      db = await getWingmanDatabase();
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('Database error in available-games:', errorMessage);
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }

    // Get all forum IDs from SPLASH_PAGE_FORUMS
    const forumIds = Object.values(SPLASH_PAGE_FORUMS).map(f => f.forumId);
    const forumsCollection = db.collection('forums');

    // Fetch all forums
    const forums = await forumsCollection.find(
      { forumId: { $in: forumIds } },
      { projection: { forumId: 1, gameTitle: 1, posts: 1 } }
    ).toArray();

    // Group forums by gameTitle and count posts
    const gameMap = new Map<string, { gameTitle: string; forumCount: number; postCount: number }>();

    for (const forum of forums) {
      const gameTitle = forum.gameTitle || '';
      const posts = forum.posts || [];
      
      // Count only top-level posts (posts without parentPostId)
      const topLevelPosts = posts.filter((post: any) => {
        return !post.parentPostId || post.parentPostId === null;
      });

      if (gameMap.has(gameTitle)) {
        const existing = gameMap.get(gameTitle)!;
        existing.forumCount += 1;
        existing.postCount += topLevelPosts.length;
      } else {
        gameMap.set(gameTitle, {
          gameTitle: gameTitle,
          forumCount: 1,
          postCount: topLevelPosts.length,
        });
      }
    }

    // Convert map to array and sort by gameTitle
    const games = Array.from(gameMap.values()).sort((a, b) => {
      return a.gameTitle.localeCompare(b.gameTitle);
    });

    return res.status(200).json({
      success: true,
      games: games,
    });
  } catch (error) {
    console.error('Error fetching available games:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch available games',
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
      console.error('MONGODB_URI_WINGMAN not set');
      return res.status(500).json({
        success: false,
        message: 'Database configuration error: MONGODB_URI_WINGMAN not set',
      });
    }

    // Connect to database with better error handling
    let wingmanDB;
    try {
      wingmanDB = await connectToWingmanDB();
    } catch (dbError) {
      console.error('Database connection error in check-status:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to database',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
      });
    }

    // Check if connection is ready
    if (!wingmanDB || wingmanDB.readyState !== 1) {
      console.error('Database connection not ready. State:', wingmanDB?.readyState);
      return res.status(500).json({
        success: false,
        message: 'Database connection not ready',
      });
    }

    // Access database - mongoose.Connection has .db property
    const db = (wingmanDB as any).db || wingmanDB;

    if (!db) {
      console.error('Database object not available');
      return res.status(500).json({
        success: false,
        message: 'Failed to access database',
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to check post status',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    });
  }
});

/**
 * POST /api/public/forum-posts
 * Creates a new post in the forum (top-level post or reply)
 * Body:
 *   - forumId: (optional) forum ID to post to (defaults to Xenoblade Chronicles 3 forum)
 *              Not required if parentPostId is provided (will be inferred from parent)
 *   - userId: user's userId
 *   - content: post content/message
 *   - parentPostId: (optional) If provided, creates a reply to this post instead of a top-level post
 *   - attachments: array of image attachment objects (optional)
 *     Each attachment should have: { url, name, size, type }
 */
router.post('/public/forum-posts', async (req: Request, res: Response) => {
  try {
    const { userId, content, attachments, parentPostId } = req.body;

    // Check authentication - return 401 if userId is missing or invalid
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Please sign up to post a comment',
        requiresAuth: true,
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

    // Verify user exists - return 401 if user not found (authentication required)
    const user = await User.findOne({ userId: userId.trim() }).lean().exec() as any;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Please sign up to post a comment',
        requiresAuth: true,
      });
    }

    // Connect to main application database
    let db;
    try {
      db = await getWingmanDatabase();
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('Database error:', errorMessage);
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }

    let forumId: string;
    let isReply = false;

    // If parentPostId is provided, validate parent post and get forumId from it
    if (parentPostId) {
      if (typeof parentPostId !== 'string' || !parentPostId.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parentPostId',
        });
      }

      const parentValidation = await validateParentPost(db, parentPostId.trim());
      if (!parentValidation) {
        return res.status(404).json({
          success: false,
          message: 'Parent post not found',
        });
      }

      forumId = parentValidation.forumId;
      isReply = true;
    } else {
      // Get forum ID from body (with validation and default) for top-level posts
      forumId = getForumId(req);
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

    // For top-level posts, check if user already has a post (one post per user per forum)
    // For replies, allow unlimited replies per user
    if (!isReply) {
      const existingPost = posts.find((post: any) => post.createdBy === userId);
      if (existingPost) {
        return res.status(400).json({
          success: false,
          message: 'You already have a post. Please edit or delete it first.',
          postId: existingPost._id?.toString(),
        });
      }
    }

    // Create new post object
    const newPost: any = {
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

    // Add parentPostId if this is a reply
    if (isReply && parentPostId) {
      newPost.parentPostId = new ObjectId(String(parentPostId.trim()));
    }

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
      message: isReply ? 'Reply created successfully' : 'Post created successfully',
      postId: newPost._id.toString(),
      parentPostId: isReply ? parentPostId : null,
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
 * POST /api/public/forum-posts/:postId/reply
 * Creates a reply to an existing post
 * Params:
 *   - postId: MongoDB ObjectId of the parent post to reply to
 * Body:
 *   - userId: user's userId
 *   - content: reply content/message
 *   - attachments: array of image attachment objects (optional)
 *     Each attachment should have: { url, name, size, type }
 */
router.post('/public/forum-posts/:postId/reply', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { userId, content, attachments } = req.body;

    // Check authentication - return 401 if userId is missing or invalid
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Please sign up to post a comment',
        requiresAuth: true,
      });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required',
      });
    }

    if (!ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID',
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
          message: 'Splash page users can only upload 1 image per reply',
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
        message: moderationResult.message || 'Your reply contains inappropriate content. Please remove any offensive words or phrases and try again.',
        detectedWords: moderationResult.detectedWords,
        moderationWarning: true,
      });
    }

    // Verify user exists - return 401 if user not found (authentication required)
    const user = await User.findOne({ userId: userId.trim() }).lean().exec() as any;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Please sign up to post a comment',
        requiresAuth: true,
      });
    }

    // Connect to main application database
    let db;
    try {
      db = await getWingmanDatabase();
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('Database error:', errorMessage);
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }

    // Validate parent post exists and get forumId
    const parentValidation = await validateParentPost(db, postId);
    if (!parentValidation) {
      return res.status(404).json({
        success: false,
        message: 'Parent post not found',
      });
    }

    const forumId = parentValidation.forumId;
    const forumsCollection = db.collection('forums');
    const forum = await forumsCollection.findOne({ forumId: forumId });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found',
      });
    }

    // Create new reply object
    const newReply = {
      _id: new ObjectId(),
      username: user.email, // Use email as username for splash page users
      message: content.trim(),
      timestamp: new Date(),
      createdBy: userId,
      parentPostId: new ObjectId(String(postId)), // Set parent post ID
      metadata: {
        edited: false,
        likes: 0,
        likedBy: [],
        attachments: validatedAttachments, // Store validated attachments
        status: 'active',
      },
    };

    // Add reply to forum's posts array
    const result = await forumsCollection.updateOne(
      { forumId: forumId },
      {
        $push: { posts: newReply as any },
        $set: {
          'metadata.totalPosts': (forum.posts || []).length + 1,
          'metadata.lastActivityAt': new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create reply',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Reply created successfully',
      postId: newReply._id.toString(),
      parentPostId: postId,
      reply: {
        author: user.email,
        content: newReply.message,
        timestamp: newReply.timestamp,
        likes: 0,
        attachments: validatedAttachments,
      },
    });
  } catch (error) {
    console.error('Error creating reply:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create reply',
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

    // Connect to main application database
    let db;
    try {
      db = await getWingmanDatabase();
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('Database error:', errorMessage);
      return res.status(500).json({
        success: false,
        message: errorMessage,
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
        'posts._id': new ObjectId(String(postId))
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

    // Connect to main application database
    let db;
    try {
      db = await getWingmanDatabase();
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('Database error:', errorMessage);
      return res.status(500).json({
        success: false,
        message: errorMessage,
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
        $pull: { posts: { _id: new ObjectId(String(postId)) } } as any,
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

    // Connect to main application database
    let db;
    try {
      db = await getWingmanDatabase();
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('Database error:', errorMessage);
      return res.status(500).json({
        success: false,
        message: errorMessage,
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

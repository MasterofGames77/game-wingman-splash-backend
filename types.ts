/**
 * LinkedIn Post Data Structure
 * 
 * This will store all LinkedIn posts organized by series.
 * Each series contains multiple posts with full content, images, and metadata.
 * 
 * Structure:
 * - seriesId: unique identifier for the series
 * - seriesTitle: display name for the series
 * - seriesDescription: optional description of the series
 * - posts: array of post objects
 */
export interface LinkedInPost {
  id: number; // Post number within the series (1-10)
  title: string; // Post title/headline
  content: string; // Full post text content
  linkedInUrl: string; // Original LinkedIn post URL
  game?: string; // Game featured in the post (if applicable)
  gameTitle?: string; // Full game title
  imageUrl?: string; // Featured image URL (if any)
  publishedDate: string; // ISO date string when post was published
  hashtags?: string[]; // Array of hashtags from the post
  metadata?: {
    // Additional metadata
    seriesDay?: number; // Day number in the series (1-10)
    featuredStats?: Array<{
      label: string;
      value: string;
      icon?: string; // Icon identifier (e.g., 'clock', 'chart', 'robot')
    }>;
  };
}

export interface LinkedInSeries {
  seriesId: string;
  seriesTitle: string;
  seriesDescription?: string;
  introPost?: LinkedInPost; // Optional introductory post that explains what the series is about
  posts: LinkedInPost[];
}

export interface QueuedAction {
  id: string;
  action: string; // 'waitlist-signup', 'forum-post', 'forum-update', 'forum-delete', 'forum-like'
  endpoint: string; // Original endpoint path
  method: string; // HTTP method
  body: any; // Request body
  headers?: Record<string, string>; // Request headers
  timestamp: string; // When the action was queued
  retries: number; // Number of retry attempts
  status: 'pending' | 'processing' | 'completed' | 'failed';
  userId?: string; // Optional user identifier
  error?: string; // Error message if failed
}
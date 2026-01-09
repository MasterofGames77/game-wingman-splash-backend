import axios from 'axios';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { getClientCredentialsAccessToken } from './twitchAuth';
import { externalApiClient } from './axiosConfig';
import NodeCache from 'node-cache';
import { shortenMarkdownLinks } from './linkShortener';

// Load environment variables
dotenv.config();

// ============================================================================
// OpenAI Client Initialization
// ============================================================================

// Lazy initialization of OpenAI client to avoid errors on server startup
let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is missing or empty. Please set it in your .env file.');
    }
    openaiInstance = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openaiInstance;
}

// ============================================================================
// Cache Implementation
// ============================================================================

// Simple cache for AI responses (1 hour TTL, max 2000 entries)
const aiCache = new NodeCache({
  stdTTL: 60 * 60, // 1 hour
  maxKeys: 2000,
  checkperiod: 300 // Check for expired keys every 5 minutes
});

// Cache for game release dates (24 hours TTL, max 5000 entries)
const releaseDateCache = new NodeCache({
  stdTTL: 24 * 60 * 60, // 24 hours
  maxKeys: 5000,
  checkperiod: 600 // Check for expired keys every 10 minutes
});

// ============================================================================
// Model Selection for Smart Multi-Model Usage
// ============================================================================

interface ModelSelectionResult {
  model: string;
  reason: string;
  releaseDate?: Date;
  releaseYear?: number;
}

/**
 * Fetch release date for a game from IGDB (lightweight version)
 */
async function fetchReleaseDateFromIGDB(gameTitle: string): Promise<Date | null> {
  try {
    const accessToken = await getClientCredentialsAccessToken();
    
    // Limit game title to 255 characters (IGDB API limit)
    const limitedTitle = gameTitle.length > 255 ? gameTitle.substring(0, 252) + '...' : gameTitle;
    
    // Escape special characters and quotes
    const sanitizedTitle = limitedTitle.replace(/"/g, '\\"');

    const response = await axios.post(
      'https://api.igdb.com/v4/games',
      `search "${sanitizedTitle}";
       fields name,first_release_date;
       limit 5;`,
      {
        headers: {
          'Client-ID': process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (response.data && response.data.length > 0) {
      const queryLower = gameTitle.toLowerCase().trim();
      
      // Check if query mentions remake/remaster/rerelease indicators
      const hasRemakeIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(gameTitle);
      
      // Try to find exact match first
      let game = response.data.find((g: any) => 
        g.name.toLowerCase().trim() === queryLower
      );
      
      // If no exact match and query has remake/remaster indicators, prioritize matches with those indicators
      if (!game && hasRemakeIndicator) {
        game = response.data.find((g: any) => {
          const gameNameLower = g.name.toLowerCase();
          const hasIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(g.name);
          const baseTitleMatch = gameNameLower.includes(queryLower.replace(/\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/gi, '').trim()) || 
                             queryLower.replace(/\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/gi, '').trim().includes(gameNameLower);
          return hasIndicator && baseTitleMatch && g.first_release_date;
        });
      }
      
      // If still no match, try partial match
      if (!game) {
        if (hasRemakeIndicator) {
          game = response.data.find((g: any) => {
            const gameNameLower = g.name.toLowerCase();
            const hasIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(g.name);
            return hasIndicator && (gameNameLower.includes(queryLower) || queryLower.includes(gameNameLower)) && g.first_release_date;
          });
        }
        
        if (!game) {
          game = response.data.find((g: any) => {
            const gameNameLower = g.name.toLowerCase();
            return (gameNameLower.includes(queryLower) || queryLower.includes(gameNameLower)) && g.first_release_date;
          });
        }
      }
      
      if (game && game.first_release_date) {
        return new Date(game.first_release_date * 1000);
      }
    }
    return null;
  } catch (error) {
    console.error('[Model Selection] Error fetching release date from IGDB:', error);
    return null;
  }
}

/**
 * Fetch release date for a game from RAWG (lightweight version)
 */
async function fetchReleaseDateFromRAWG(gameTitle: string): Promise<Date | null> {
  try {
    const sanitizedTitle = gameTitle.toLowerCase().trim();
    const url = `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(sanitizedTitle)}&search_precise=true&page_size=5`;
    
    const response = await externalApiClient.get(url);

    if (response.data && response.data.results.length > 0) {
      // Check if query mentions remake/remaster/rerelease indicators
      const hasRemakeIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(gameTitle);
      
      // Find exact match first
      let game = response.data.results.find((g: any) => {
        const normalizedGameName = g.name.toLowerCase().trim();
        return normalizedGameName === sanitizedTitle;
      });
      
      // If no exact match and query has remake/remaster indicators, prioritize matches with those indicators
      if (!game && hasRemakeIndicator) {
        game = response.data.results.find((g: any) => {
          const normalizedGameName = g.name.toLowerCase();
          const hasIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(g.name);
          const baseTitleMatch = normalizedGameName.includes(sanitizedTitle.replace(/\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/gi, '').trim()) || 
                             sanitizedTitle.replace(/\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/gi, '').trim().includes(normalizedGameName);
          return hasIndicator && baseTitleMatch && g.released;
        });
      }
      
      // If still no match, try partial match (but prefer matches with indicators if query has them)
      if (!game) {
        if (hasRemakeIndicator) {
          game = response.data.results.find((g: any) => {
            const normalizedGameName = g.name.toLowerCase();
            const hasIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(g.name);
            return hasIndicator && (normalizedGameName === sanitizedTitle || 
                   normalizedGameName.includes(sanitizedTitle) ||
                   sanitizedTitle.includes(normalizedGameName)) && g.released;
          });
        }
        
        if (!game) {
          game = response.data.results.find((g: any) => {
            const normalizedGameName = g.name.toLowerCase().trim();
            return (normalizedGameName === sanitizedTitle || 
                   normalizedGameName.includes(sanitizedTitle) ||
                   sanitizedTitle.includes(normalizedGameName)) && g.released;
          });
        }
      }

      if (game && game.released) {
        return new Date(game.released);
      }
    }
    return null;
  } catch (error) {
    console.error('[Model Selection] Error fetching release date from RAWG:', error);
    return null;
  }
}

/**
 * Get release date for a game with caching
 */
export async function getGameReleaseDate(gameTitle: string): Promise<Date | null> {
  const cacheKey = gameTitle.toLowerCase().trim();
  
  // Check cache first
  const cached = releaseDateCache.get<Date>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Try IGDB first (more reliable)
  let releaseDate = await fetchReleaseDateFromIGDB(gameTitle);
  
  // Fallback to RAWG if IGDB fails
  if (!releaseDate) {
    releaseDate = await fetchReleaseDateFromRAWG(gameTitle);
  }
  
  // Cache the result if we got one
  if (releaseDate) {
    releaseDateCache.set(cacheKey, releaseDate);
  }
  
  return releaseDate;
}

/**
 * Determine which OpenAI model to use based on game release date
 * - GPT-5.2 for games released 2024+ (better knowledge cutoff)
 * - GPT-4o for games released before 2024
 */
export async function selectModelForQuestion(
  gameTitle?: string,
  question?: string
): Promise<ModelSelectionResult> {
  const CUTOFF_YEAR = 2024;
  const DEFAULT_MODEL = 'gpt-4o-search-preview';
  
  // If no game title, try to extract from question
  let detectedGame = gameTitle;
  if (!detectedGame && question) {
    detectedGame = await extractGameTitleFromQuestion(question);
  }
  
  // If still no game, use default model
  if (!detectedGame) {
    return {
      model: DEFAULT_MODEL,
      reason: 'no_game_detected'
    };
  }
  
  // Get release date (with caching)
  try {
    const releaseDate = await getGameReleaseDate(detectedGame);
    
    if (releaseDate) {
      const releaseYear = releaseDate.getFullYear();
      
      if (releaseYear >= CUTOFF_YEAR) {
        return {
          model: 'gpt-5.2',
          reason: `game_released_${releaseYear}`,
          releaseDate: releaseDate,
          releaseYear: releaseYear
        };
      } else {
        return {
          model: DEFAULT_MODEL,
          reason: `game_released_${releaseYear}`,
          releaseDate: releaseDate,
          releaseYear: releaseYear
        };
      }
    }
  } catch (error) {
    console.error('[Model Selection] Error in selectModelForQuestion:', error);
  }
  
  // Default to 4o if we can't determine release date
  return {
    model: DEFAULT_MODEL,
    reason: 'release_date_unavailable'
  };
}

// ============================================================================
// IGDB API Integration
// ============================================================================

/**
 * Fetch genres for a game from IGDB
 */
export async function fetchGenresFromIGDB(gameTitle: string): Promise<string[] | null> {
  try {
    const accessToken = await getClientCredentialsAccessToken();
    
    // Limit game title to 255 characters (IGDB API limit)
    const limitedTitle = gameTitle.length > 255 ? gameTitle.substring(0, 252) + '...' : gameTitle;
    
    // Escape special characters and quotes
    const sanitizedTitle = limitedTitle.replace(/"/g, '\\"');

    const response = await axios.post(
      'https://api.igdb.com/v4/games',
      `search "${sanitizedTitle}";
       fields name,genres.name;
       limit 10;`,
      {
        headers: {
          'Client-ID': process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (response.data && response.data.length > 0) {
      const queryLower = gameTitle.toLowerCase().trim();
      
      // Check if query mentions remake/remaster/rerelease indicators
      const hasRemakeIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(gameTitle);
      
      // Try to find exact match first
      let game = response.data.find((g: any) => 
        g.name.toLowerCase().trim() === queryLower
      );
      
      // If no exact match and query has remake/remaster indicators, prioritize matches with those indicators
      if (!game && hasRemakeIndicator) {
        game = response.data.find((g: any) => {
          const gameNameLower = g.name.toLowerCase();
          const hasIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(g.name);
          const baseTitleMatch = gameNameLower.includes(queryLower.replace(/\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/gi, '').trim()) || 
                             queryLower.replace(/\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/gi, '').trim().includes(gameNameLower);
          return hasIndicator && baseTitleMatch;
        });
      }
      
      // If still no match, try partial match (but prefer matches with indicators if query has them)
      if (!game) {
        if (hasRemakeIndicator) {
          game = response.data.find((g: any) => {
            const gameNameLower = g.name.toLowerCase();
            const hasIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(g.name);
            return hasIndicator && (gameNameLower.includes(queryLower) || queryLower.includes(gameNameLower));
          });
        }
        
        if (!game) {
          game = response.data.find((g: any) => {
            const gameNameLower = g.name.toLowerCase();
            return gameNameLower.includes(queryLower) || queryLower.includes(gameNameLower);
          });
        }
      }
      
      if (game && game.genres && game.genres.length > 0) {
        const genres = game.genres
          .map((g: any) => g.name)
          .filter(Boolean);
        return genres.length > 0 ? genres : null;
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching genres from IGDB:", error);
    return null;
  }
}

/**
 * Fetch game information from IGDB
 */
export async function fetchFromIGDB(gameTitle: string): Promise<string | null> {
  try {
    const accessToken = await getClientCredentialsAccessToken();
    
    // Limit game title to 255 characters (IGDB API limit)
    const limitedTitle = gameTitle.length > 255 ? gameTitle.substring(0, 252) + '...' : gameTitle;
    
    // Escape special characters and quotes
    const sanitizedTitle = limitedTitle.replace(/"/g, '\\"');

    const response = await axios.post(
      'https://api.igdb.com/v4/games',
      `search "${sanitizedTitle}";
       fields name,first_release_date,platforms.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,genres.name,rating,aggregated_rating;
       limit 10;`,
      {
        headers: {
          'Client-ID': process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (response.data && response.data.length > 0) {
      const queryLower = gameTitle.toLowerCase().trim();
      
      // Check if query mentions remake/remaster/rerelease indicators
      const hasRemakeIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(gameTitle);
      
      // Try to find exact match first
      let game = response.data.find((g: any) => 
        g.name.toLowerCase().trim() === queryLower
      );
      
      // If no exact match and query has remake/remaster indicators, prioritize matches with those indicators
      if (!game && hasRemakeIndicator) {
        // First, try to find a match that contains the remake/remaster indicator
        game = response.data.find((g: any) => {
          const gameNameLower = g.name.toLowerCase();
          // Check if game name contains the remake indicator and matches the base title
          const hasIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(g.name);
          const baseTitleMatch = gameNameLower.includes(queryLower.replace(/\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/gi, '').trim()) || 
                             queryLower.replace(/\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/gi, '').trim().includes(gameNameLower);
          return hasIndicator && baseTitleMatch;
        });
      }
      
      // If still no match, try partial match (but prefer matches with indicators if query has them)
      if (!game) {
        if (hasRemakeIndicator) {
          // Try to find match with indicator first
          game = response.data.find((g: any) => {
            const gameNameLower = g.name.toLowerCase();
            const hasIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(g.name);
            return hasIndicator && (gameNameLower.includes(queryLower) || queryLower.includes(gameNameLower));
          });
        }
        
        // Fallback to any partial match
        if (!game) {
          game = response.data.find((g: any) => {
            const gameNameLower = g.name.toLowerCase();
            return gameNameLower.includes(queryLower) || queryLower.includes(gameNameLower);
          });
        }
      }
      
      if (!game) {
        return null;
      }
      
      // Build comprehensive response with metadata
      const developers = game.involved_companies?.filter((ic: any) => ic.developer)
        .map((ic: any) => ic.company?.name).filter(Boolean).join(", ") || "unknown developers";
      const publishers = game.involved_companies?.filter((ic: any) => ic.publisher)
        .map((ic: any) => ic.company?.name).filter(Boolean).join(", ") || "unknown publishers";
      const platforms = game.platforms?.map((p: any) => p.name).filter(Boolean).join(", ") || "unknown platforms";
      const genres = game.genres?.map((g: any) => g.name).filter(Boolean).join(", ") || null;
      const rating = game.aggregated_rating ? Math.round(game.aggregated_rating) : (game.rating ? Math.round(game.rating) : null);
      const releaseDate = game.first_release_date 
        ? new Date(game.first_release_date * 1000).toLocaleDateString()
        : "unknown release date";

      let gameInfo = `${game.name} was released on ${releaseDate}. It was developed by ${developers} and published by ${publishers} for ${platforms}.`;
      
      if (genres) {
        gameInfo += ` Genres: ${genres}.`;
      }
      
      if (rating) {
        gameInfo += ` Rating: ${rating}/100.`;
      }

      return gameInfo;
    }
    return null;
  } catch (error) {
    console.error("Error fetching data from IGDB:", error);
    if (axios.isAxiosError(error)) {
      console.error("IGDB API Response:", error.response?.data);
    }
    return null;
  }
}

// ============================================================================
// RAWG API Integration
// ============================================================================

/**
 * Fetch data from RAWG with enhanced matching logic
 */
async function fetchFromRAWG(gameTitle: string): Promise<string | null> {
  try {
    const sanitizedTitle = gameTitle.toLowerCase().trim();
    const url = `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(sanitizedTitle)}&search_precise=true`;
    
    const response = await externalApiClient.get(url);

    if (response.data && response.data.results.length > 0) {
      // Check if query mentions remake/remaster/rerelease indicators
      const hasRemakeIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(gameTitle);
      
      // Find exact match first
      let game = response.data.results.find((g: any) => {
        const normalizedGameName = g.name.toLowerCase().trim();
        return normalizedGameName === sanitizedTitle;
      });
      
      // If no exact match and query has remake/remaster indicators, prioritize matches with those indicators
      if (!game && hasRemakeIndicator) {
        game = response.data.results.find((g: any) => {
          const normalizedGameName = g.name.toLowerCase();
          const hasIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(g.name);
          const baseTitleMatch = normalizedGameName.includes(sanitizedTitle.replace(/\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/gi, '').trim()) || 
                             sanitizedTitle.replace(/\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/gi, '').trim().includes(normalizedGameName);
          return hasIndicator && baseTitleMatch;
        });
      }
      
      // If still no match, try partial match (but prefer matches with indicators if query has them)
      if (!game) {
        if (hasRemakeIndicator) {
          game = response.data.results.find((g: any) => {
            const normalizedGameName = g.name.toLowerCase();
            const hasIndicator = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i.test(g.name);
            return hasIndicator && (normalizedGameName === sanitizedTitle || 
                   normalizedGameName.includes(sanitizedTitle) ||
                   sanitizedTitle.includes(normalizedGameName));
          });
        }
        
        // Fallback to any partial match
        if (!game) {
          game = response.data.results.find((g: any) => {
            const normalizedGameName = g.name.toLowerCase().trim();
            return normalizedGameName === sanitizedTitle || 
                   normalizedGameName.includes(sanitizedTitle) ||
                   sanitizedTitle.includes(normalizedGameName);
          });
        }
      }

      if (game) {
        return `${game.name} (Released: ${game.released}, Genres: ${game.genres.map((g: any) => g.name).join(', ')}, ` +
               `Platforms: ${game.platforms.map((p: any) => p.platform.name).join(', ')}, ` +
               `URL: https://rawg.io/games/${game.slug})`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching data from RAWG:", error);
    return null;
  }
}

// ============================================================================
// Game Title Extraction
// ============================================================================

// Constants for remake/remaster/rerelease indicators
// Used to identify and prioritize specific game versions
const REMAKE_INDICATORS = '(?:Part\\s+[0-9IVXLCDM]+|Remake|Remaster|Reimagined|HD|4K|Definitive|Edition|Deluxe|Ultimate|Complete|Collection|Final\\s+Mix|Re:|DS|Switch|Combo|Pack|Legacy|Anniversary|2|II|3|III|4|IV|5|V|6|VI|7|VII|8|VIII|9|IX|10|X|World\\s*2|World\\s*II|Galaxy\\s*2)';
const REMAKE_INDICATORS_REGEX = /\b(remake|remaster|reimagined|hd|4k|definitive|edition|deluxe|ultimate|complete|collection|final\s+mix|re:|ds|switch|combo|pack|legacy|anniversary)\b/i;

/**
 * Check if a game title is a bundle, DLC, or expansion
 */
function isBundleOrDLC(title: string): boolean {
  const lower = title.toLowerCase();
  const bundleIndicators = [
    'bundle',
    'expansion pass',
    'expansion pack',
    'dlc',
    'twin pack',
    'double pack',
    'collection',
    'edition',
    'remastered twin',
    '&',
    'and expansion',
    'season pass',
    'complete edition',
    'ultimate edition',
    'deluxe edition',
  ];
  
  return bundleIndicators.some(indicator => lower.includes(indicator));
}

/**
 * Extract all games from a bundle/DLC name
 * Returns an array of game titles found in the bundle
 * Example: "Final Fantasy VII & Final Fantasy VIII Remastered Twin Pack"
 *          -> ["Final Fantasy VII", "Final Fantasy VIII"]
 */
function extractGamesFromBundle(bundleTitle: string): string[] {
  const games: string[] = [];
  
  // Handle twin packs / double packs - extract both games
  // Pattern: "Game A & Game B Twin Pack" or "Game A and Game B Twin Pack"
  const twinPackMatch = bundleTitle.match(/^(.+?)(?:\s*&\s*|\s+and\s+)(.+?)(?:\s+(?:twin|double|pack|remastered).*)?$/i);
  if (twinPackMatch && twinPackMatch[1] && twinPackMatch[2]) {
    const firstGame = twinPackMatch[1].trim();
    const secondGame = twinPackMatch[2].trim();
    
    // Clean up any remaining bundle suffixes from second game
    const cleanedSecond = secondGame.replace(/\s+(?:twin|double|pack|remastered|bundle|edition).*$/i, '').trim();
    
    if (firstGame.length >= 5) {
      games.push(firstGame);
    }
    if (cleanedSecond.length >= 5 && cleanedSecond !== firstGame) {
      games.push(cleanedSecond);
    }
    
    if (games.length > 0) {
      return games;
    }
  }
  
  // For single-game bundles with expansion/DLC, extract the base game
  // Pattern: "Game Name and Expansion Pass Bundle"
  const expansionMatch = bundleTitle.match(/^(.+?)(?:\s+and\s+.*?(?:expansion|pass|bundle|pack|dlc|edition).*)$/i);
  if (expansionMatch && expansionMatch[1]) {
    const baseGame = expansionMatch[1].trim();
    if (baseGame.length >= 5) {
      games.push(baseGame);
      return games;
    }
  }
  
  // Fallback: remove common bundle suffixes
  let cleaned = bundleTitle
    .replace(/\s+and\s+.*?(?:expansion|pass|bundle|pack|dlc|edition).*$/i, '')
    .replace(/\s+&\s+.*?(?:remastered|twin|double|pack).*$/i, '')
    .replace(/\s+(?:expansion|pass|bundle|pack|dlc|edition|collection|remastered).*$/i, '')
    .trim();
  
  if (cleaned.length >= 5 && cleaned.length < bundleTitle.length * 0.7) {
    games.push(cleaned);
    return games;
  }
  
  // If we can't extract games, return the original title
  return [bundleTitle];
}

/**
 * Extract base game title from bundle/DLC name (backward compatibility)
 * For multi-game bundles, returns the first game (use extractGamesFromBundle for better results)
 */
function extractBaseGameFromBundle(bundleTitle: string): string {
  const games = extractGamesFromBundle(bundleTitle);
  return games.length > 0 ? games[0] : bundleTitle;
}

/**
 * Determine which game from a bundle is mentioned in the question text
 * Returns the most relevant game title, or null if none found
 */
function findRelevantGameFromBundle(bundleTitle: string, question: string): string | null {
  const games = extractGamesFromBundle(bundleTitle);
  if (games.length === 0) {
    return null;
  }
  
  // If only one game, return it
  if (games.length === 1) {
    return games[0];
  }
  
  // For multiple games, check which one appears in the question
  const lowerQuestion = question.toLowerCase();
  const gameScores: Array<{ game: string; score: number }> = [];
  
  for (const game of games) {
    const lowerGame = game.toLowerCase();
    let score = 0;
    
    // Check for exact match (highest priority)
    if (lowerQuestion.includes(lowerGame)) {
      score += 100;
      
      // Bonus if it's mentioned as a standalone phrase (not part of another word)
      const gameWords = lowerGame.split(/\s+/);
      const allWordsMatch = gameWords.every(word => {
        // Check if word appears as a whole word in the question
        // Escape special regex characters
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match word at start/end of string or surrounded by non-alphanumeric characters
        // This handles special characters like ö, ō correctly
        const wordRegex = new RegExp(`(?:^|[^a-z0-9À-ÿĀ-ž])${escapedWord}(?:[^a-z0-9À-ÿĀ-ž]|$)`, 'i');
        return wordRegex.test(lowerQuestion);
      });
      
      if (allWordsMatch) {
        score += 50;
      }
    }
    
    // Check for partial matches (key words from the game title)
    const gameWords = lowerGame.split(/\s+/).filter(w => w.length > 3);
    const matchingWords = gameWords.filter(word => lowerQuestion.includes(word));
    score += matchingWords.length * 10;
    
    // Check for roman numerals or numbers (e.g., "VII", "VIII", "2", "3")
    const numberMatch = game.match(/\b([IVXLCDM]+|\d+)\b/i);
    if (numberMatch) {
      const number = numberMatch[1].toLowerCase();
      if (lowerQuestion.includes(number)) {
        score += 30;
      }
    }
    
    gameScores.push({ game, score });
  }
  
  // Sort by score (highest first)
  gameScores.sort((a, b) => b.score - a.score);
  
  // Return the game with the highest score, but only if it has a meaningful score
  if (gameScores.length > 0 && gameScores[0].score > 0) {
    return gameScores[0].game;
  }
  
  // If no clear winner, return the first game (fallback)
  return games[0];
}

/**
 * Clean game title by removing engine names and other unwanted prefixes
 * Removes: "Unreal Engine", "Unity", "Source Engine", etc.
 */
function cleanGameTitle(title: string): string {
  if (!title) return title;
  
  // Engine names and prefixes to remove (case-insensitive)
  const enginePrefixes = [
    'unreal engine',
    'unity',
    'source engine',
    'cryengine',
    'frostbite',
    'id tech',
    'unreal',
    'game engine',
  ];
  
  let cleaned = title.trim();
  
  // Remove engine prefixes from the beginning
  for (const engine of enginePrefixes) {
    const regex = new RegExp(`^${engine}\\s+`, 'i');
    cleaned = cleaned.replace(regex, '');
  }
  
  // Also check if engine name appears in the middle and remove it
  for (const engine of enginePrefixes) {
    const regex = new RegExp(`\\s+${engine}\\s+`, 'i');
    cleaned = cleaned.replace(regex, ' ');
  }
  
  return cleaned.trim();
}

/**
 * Normalize game titles that should start with "The"
 * Ensures titles like "Legend of Zelda" become "The Legend of Zelda"
 */
function normalizeGameTitle(title: string): string {
  if (!title) return title;
  
  // First clean the title to remove engine names
  let cleaned = cleanGameTitle(title);
  
  const lower = cleaned.toLowerCase().trim();
  
  // Games that should always start with "The"
  const gamesRequiringThe = [
    'legend of zelda',
    'elder scrolls',
    'witcher',
    'last of us',
    'walking dead',
    'sims',
  ];
  
  // Check if title matches a game that requires "The" but doesn't have it
  for (const gamePattern of gamesRequiringThe) {
    if (lower.startsWith(gamePattern) && !lower.startsWith('the ' + gamePattern)) {
      // Add "The" at the beginning
      return 'The ' + cleaned.trim();
    }
  }
  
  return cleaned;
}

/**
 * Search IGDB for a game title and return the matched game name if found
 * Prefers base games over bundles/DLC
 * Handles remakes, remasters, and bundles correctly
 */
async function searchGameInIGDB(candidateTitle: string): Promise<string | null> {
  try {
    const accessToken = await getClientCredentialsAccessToken();
    const sanitizedTitle = candidateTitle.replace(/"/g, '\\"');
    
    const response = await axios.post(
      'https://api.igdb.com/v4/games',
      `search "${sanitizedTitle}";
       fields name;
       limit 10;`,
      {
        headers: {
          'Client-ID': process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (response.data && response.data.length > 0) {
      const lowerCandidate = candidateTitle.toLowerCase();
      
      // Check if query mentions remake/remaster indicators
      const hasRemakeIndicator = REMAKE_INDICATORS_REGEX.test(candidateTitle);
      
      // Extract distinctive words from candidate (numbers, remake, HD, version indicators, etc.)
      const candidateDistinctiveWords = lowerCandidate
        .split(/\s+/)
        .filter(w => {
          if (/^\d+$/.test(w) || /^(ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(w)) return true;
          if (/remake|remaster|reimagined/i.test(w)) return true;
          if (/world|part|sequel/i.test(w)) return true;
          if (/^hd$|^4k$|definitive|edition|deluxe|ultimate|complete|collection/i.test(w)) return true;
          return false;
        })
        .map(w => w.replace(/[^a-z0-9]/g, ''));
      
      // First, try to find exact match (highest priority)
      const exactMatch = response.data.find((g: any) => {
        const gameName = g.name.toLowerCase();
        return gameName === lowerCandidate;
      });
      
      if (exactMatch && !isBundleOrDLC(exactMatch.name)) {
        return cleanGameTitle(normalizeGameTitle(exactMatch.name));
      }
      
      // If candidate has distinctive words, require them in the match
      // This prevents "Resident Evil 4 Remake" from matching "Resident Evil Archives"
      const matchesWithDistinctive = response.data.filter((g: any) => {
        const gameName = g.name.toLowerCase();
        const hasBasicMatch = gameName.includes(lowerCandidate) || lowerCandidate.includes(gameName);
        
        if (!hasBasicMatch) return false;
        
        // If candidate has distinctive words, they MUST be in the result
        if (candidateDistinctiveWords.length > 0) {
          const allDistinctivePresent = candidateDistinctiveWords.every(dw => {
            if (dw.length > 0) {
              const wordPattern = new RegExp(`\\b${dw}\\b`, 'i');
              return wordPattern.test(gameName);
            }
            return true;
          });
          return allDistinctivePresent;
        }
        
        return true;
      });
      
      // If query has remake indicator, prioritize matches with that indicator
      if (hasRemakeIndicator) {
        const remakeMatch = matchesWithDistinctive.find((g: any) => {
          const gameName = g.name.toLowerCase();
          const hasIndicator = REMAKE_INDICATORS_REGEX.test(g.name);
          return hasIndicator && !isBundleOrDLC(g.name);
        });
        if (remakeMatch) {
          return cleanGameTitle(normalizeGameTitle(remakeMatch.name));
        }
      }
      
      // Prefer non-bundle matches with distinctive words
      const nonBundleMatch = matchesWithDistinctive.find((g: any) => !isBundleOrDLC(g.name));
      if (nonBundleMatch) {
        return cleanGameTitle(normalizeGameTitle(nonBundleMatch.name));
      }
      
      // If result is a bundle and candidate mentions a specific game, extract that game
      const bundleMatch = matchesWithDistinctive.find((g: any) => isBundleOrDLC(g.name));
      if (bundleMatch) {
        const relevantGame = findRelevantGameFromBundle(bundleMatch.name, candidateTitle);
        if (relevantGame && relevantGame !== bundleMatch.name) {
          // Try to find the specific game
          const specificGameMatch = await searchGameInIGDB(relevantGame);
          if (specificGameMatch) {
            return specificGameMatch;
          }
          return cleanGameTitle(normalizeGameTitle(relevantGame));
        }
        // Fallback to base game extraction
        const baseGame = extractBaseGameFromBundle(bundleMatch.name);
        if (baseGame !== bundleMatch.name) {
          return cleanGameTitle(normalizeGameTitle(baseGame));
        }
      }
      
      // Fallback to first match with distinctive words (even if bundle)
      if (matchesWithDistinctive.length > 0) {
        return cleanGameTitle(normalizeGameTitle(matchesWithDistinctive[0].name));
      }
      
      // If no matches with distinctive words and candidate has distinctive words, return null
      // This prevents matching wrong games when distinctive words are missing
      if (candidateDistinctiveWords.length > 0) {
        return null; // Don't return a match if distinctive words are missing
      }
      
      // Only do basic matching if candidate has no distinctive words (generic titles)
      const basicMatch = response.data.find((g: any) => {
        const gameName = g.name.toLowerCase();
        return gameName === lowerCandidate && !isBundleOrDLC(g.name);
      });
      
      if (basicMatch) {
        return cleanGameTitle(normalizeGameTitle(basicMatch.name));
      }
      
      // If still no match, return null rather than returning wrong game
      return null;
    }
    return null;
  } catch (error) {
    // Silently fail - this is a background operation
    return null;
  }
}

/**
 * Search RAWG for a game title and return the matched game name if found
 * Prefers base games over bundles/DLC
 * Handles remakes, remasters, and bundles correctly
 */
async function searchGameInRAWG(candidateTitle: string): Promise<string | null> {
  try {
    const sanitizedTitle = candidateTitle.toLowerCase().trim();
    const url = `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(sanitizedTitle)}&page_size=10`;
    
    const response = await axios.get(url);

    if (response.data && response.data.results.length > 0) {
      const lowerCandidate = sanitizedTitle;
      
      // Check if query mentions remake/remaster indicators
      const hasRemakeIndicator = REMAKE_INDICATORS_REGEX.test(candidateTitle);
      
      // Extract distinctive words from candidate (numbers, remake, HD, version indicators, etc.)
      const candidateDistinctiveWords = lowerCandidate
        .split(/\s+/)
        .filter(w => {
          if (/^\d+$/.test(w) || /^(ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(w)) return true;
          if (/remake|remaster|reimagined/i.test(w)) return true;
          if (/world|part|sequel/i.test(w)) return true;
          if (/^hd$|^4k$|definitive|edition|deluxe|ultimate|complete|collection/i.test(w)) return true;
          return false;
        })
        .map(w => w.replace(/[^a-z0-9]/g, ''));
      
      // First, try to find exact match (highest priority)
      const exactMatch = response.data.results.find((g: any) => {
        const normalizedGameName = g.name.toLowerCase().trim();
        return normalizedGameName === lowerCandidate;
      });
      
      if (exactMatch && !isBundleOrDLC(exactMatch.name)) {
        return cleanGameTitle(normalizeGameTitle(exactMatch.name));
      }
      
      // If candidate has distinctive words, require them in the match
      const matchesWithDistinctive = response.data.results.filter((g: any) => {
        const normalizedGameName = g.name.toLowerCase().trim();
        const hasBasicMatch = normalizedGameName === lowerCandidate || 
                             normalizedGameName.includes(lowerCandidate) ||
                             lowerCandidate.includes(normalizedGameName);
        
        if (!hasBasicMatch) return false;
        
        // If candidate has distinctive words, they MUST be in the result
        if (candidateDistinctiveWords.length > 0) {
          const allDistinctivePresent = candidateDistinctiveWords.every(dw => {
            if (dw.length > 0) {
              const wordPattern = new RegExp(`\\b${dw}\\b`, 'i');
              return wordPattern.test(normalizedGameName);
            }
            return true;
          });
          return allDistinctivePresent;
        }
        
        return true;
      });
      
      // If query has remake indicator, prioritize matches with that indicator
      if (hasRemakeIndicator) {
        const remakeMatch = matchesWithDistinctive.find((g: any) => {
          const normalizedGameName = g.name.toLowerCase();
          const hasIndicator = REMAKE_INDICATORS_REGEX.test(g.name);
          return hasIndicator && !isBundleOrDLC(g.name);
        });
        if (remakeMatch) {
          return cleanGameTitle(normalizeGameTitle(remakeMatch.name));
        }
      }
      
      // Prefer non-bundle matches with distinctive words
      const nonBundleMatch = matchesWithDistinctive.find((g: any) => !isBundleOrDLC(g.name));
      if (nonBundleMatch) {
        return cleanGameTitle(normalizeGameTitle(nonBundleMatch.name));
      }
      
      // If result is a bundle and candidate mentions a specific game, extract that game
      const bundleMatch = matchesWithDistinctive.find((g: any) => isBundleOrDLC(g.name));
      if (bundleMatch) {
        const relevantGame = findRelevantGameFromBundle(bundleMatch.name, candidateTitle);
        if (relevantGame && relevantGame !== bundleMatch.name) {
          // Try to find the specific game
          const specificGameMatch = await searchGameInRAWG(relevantGame);
          if (specificGameMatch) {
            return specificGameMatch;
          }
          return cleanGameTitle(normalizeGameTitle(relevantGame));
        }
        // Fallback to base game extraction
        const baseGame = extractBaseGameFromBundle(bundleMatch.name);
        if (baseGame !== bundleMatch.name) {
          return cleanGameTitle(normalizeGameTitle(baseGame));
        }
      }
      
      // Fallback to first match with distinctive words (even if bundle)
      if (matchesWithDistinctive.length > 0) {
        return cleanGameTitle(normalizeGameTitle(matchesWithDistinctive[0].name));
      }
      
      // If no matches with distinctive words and candidate has distinctive words, return null
      if (candidateDistinctiveWords.length > 0) {
        return null; // Don't return a match if distinctive words are missing
      }
      
      // Only do basic matching if candidate has no distinctive words (generic titles)
      const nonBundleMatches = response.data.results.filter((g: any) => {
        const normalizedGameName = g.name.toLowerCase().trim();
        return normalizedGameName === lowerCandidate && !isBundleOrDLC(g.name);
      });
      
      if (nonBundleMatches.length > 0) {
        return cleanGameTitle(normalizeGameTitle(nonBundleMatches[0].name));
      }
      
      // If no match found, return null rather than returning wrong game
      return null;
    }
    return null;
  } catch (error) {
    // Silently fail - this is a background operation
    return null;
  }
}

/**
 * Helper to check if a string is likely a question word
 */
function isLikelyQuestionWord(text: string): boolean {
  const questionWords = ['what', 'which', 'where', 'when', 'why', 'how', 'who', 'the', 'a', 'an'];
  return questionWords.includes(text.toLowerCase()) || 
         questionWords.some(word => text.toLowerCase().startsWith(word + ' '));
}

/**
 * Check if a single word is a common noun (not a proper noun/game title)
 * Common nouns are lowercase words that refer to general things, not specific titles
 */
function isCommonNoun(word: string): boolean {
  const lower = word.toLowerCase();
  
  // Common nouns that might appear in game content but aren't game titles
  const commonNouns = [
    // Food/ingredients
    'seafood', 'paella', 'ingredient', 'ingredients', 'recipe', 'recipes',
    'cook', 'cooking', 'food', 'meal', 'meals', 'dish', 'dishes',
    // Items/objects
    'sword', 'shield', 'armor', 'weapon', 'item', 'items', 'tool', 'tools',
    'potion', 'potions', 'key', 'keys', 'coin', 'coins', 'gem', 'gems',
    // Characters/entities
    'enemy', 'enemies', 'boss', 'bosses', 'character', 'characters',
    'npc', 'npcs', 'monster', 'monsters', 'creature', 'creatures',
    // Locations
    'area', 'areas', 'zone', 'zones', 'level', 'levels', 'dungeon', 'dungeons',
    'location', 'locations', 'place', 'places', 'room', 'rooms',
    // Actions/mechanics
    'attack', 'attacks', 'defense', 'defenses', 'skill', 'skills', 'ability', 'abilities',
    'quest', 'quests', 'mission', 'missions', 'objective', 'objectives',
    // Generic terms
    'guide', 'guides', 'help', 'tips', 'tricks', 'strategy', 'strategies',
    'walkthrough', 'walkthroughs', 'tutorial', 'tutorials'
  ];
  
  return commonNouns.includes(lower);
}

/**
 * Validate if a candidate title looks like a real game title
 * Filters out suspicious short words, common words, and non-game terms
 */
function isValidGameTitleCandidate(candidate: string): boolean {
  if (!candidate || candidate.length < 3) return false;
  
  const lower = candidate.toLowerCase().trim();
  
  // Reject single common words that aren't games
  const commonWords = [
    'tin', 'can', 'jump', 'fly', 'migration', 'the', 'a', 'an',
    'how', 'what', 'where', 'when', 'why', 'which', 'who',
    'has', 'have', 'is', 'are', 'was', 'were', 'do', 'does',
    'game', 'games', 'play', 'player', 'playing'
  ];
  
  if (commonWords.includes(lower)) return false;
  
  // Reject if it's just one word and it's too short or common
  const words = lower.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 1 && (words[0].length < 4 || commonWords.includes(words[0]))) {
    return false;
  }
  
  // For single-word candidates, be more strict - they're likely game content, not game titles
  // Multi-word candidates are more likely to be actual game titles
  if (words.length === 1) {
    // Reject if it's a common noun (not a proper noun)
    if (isCommonNoun(candidate)) {
      return false;
    }
    // Only accept single words if they look like proper nouns (start with capital)
    // and are reasonably long (at least 5 chars)
    if (!/^[A-ZÀ-ÿĀ-ž]/.test(candidate) || candidate.length < 5) {
      return false;
    }
  }
  
  // Reject generic two-word combinations that are likely not game titles
  // These are common words that appear in questions but aren't game titles
  if (words.length === 2) {
    const genericCombinations = [
      'sword master', 'master sword', 'blue shield', 'shield alliance',
      'best weapon', 'weapon guide', 'how to', 'what is', 'where is',
      'game guide', 'walkthrough guide', 'strategy guide'
    ];
    if (genericCombinations.includes(lower)) {
      return false;
    }
    
    // Also reject if both words are very common/generic
    const genericWords = ['sword', 'master', 'shield', 'alliance', 'blue', 'red', 'green', 'gold', 'silver', 'weapon', 'item', 'guide', 'help'];
    if (genericWords.includes(words[0]) && genericWords.includes(words[1])) {
      // Only reject if it's a very generic combination
      if (words[0].length < 6 && words[1].length < 6) {
        return false;
      }
    }
  }
  
  // Reject if it contains only numbers or special characters
  if (!/[a-z]/.test(lower)) return false;
  
  // Reject if it's too long (likely not a game title)
  if (candidate.length > 80) return false;
  
  // Reject if it contains suspicious patterns
  const suspiciousPatterns = [
    /\b(tin can|jump fly|migration)\b/i,
    /^[a-z]\s/i, // Single lowercase letter followed by space
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(candidate))) {
    return false;
  }
  
  return true;
}

/**
 * Validate if an API result is acceptable given the original candidate
 * Rejects results that contain unexpected words like "Multiplayer" that weren't in the candidate
 */
function isValidAPIResult(apiResult: string, originalCandidate: string): boolean {
  if (!apiResult || !originalCandidate) return true; // If we can't validate, allow it
  
  const lowerResult = apiResult.toLowerCase();
  const lowerCandidate = originalCandidate.toLowerCase();
  
  // Words that shouldn't appear in results unless they were in the original candidate
  const unexpectedWords = [
    'multiplayer',
    'co-op',
    'coop',
    'online',
    'offline',
    'single player',
    'singleplayer',
    'local',
    'split screen',
    'splitscreen'
  ];
  
  // Check if result contains unexpected words that weren't in the candidate
  for (const word of unexpectedWords) {
    if (lowerResult.includes(word) && !lowerCandidate.includes(word)) {
      // Reject if the word appears in the result but not in the candidate
      return false;
    }
  }
  
  // Additional check: if result is significantly longer than candidate and contains unexpected words
  // This catches cases where "Multiplayer" was added
  if (apiResult.length > originalCandidate.length * 1.3) {
    const resultWords = lowerResult.split(/\s+/);
    const candidateWords = lowerCandidate.split(/\s+/);
    const newWords = resultWords.filter(w => !candidateWords.includes(w));
    
    // If new words include unexpected terms, reject
    if (newWords.some(w => unexpectedWords.some(uw => w.includes(uw)))) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if an API result is relevant to the question text
 * Ensures the result shares significant words with the question or candidate
 * STRICT VERSION: Requires distinctive words (numbers, remake, sequel indicators) to match
 */
function isAPIResultRelevantToQuestion(apiResult: string, question: string, candidate: string): boolean {
  if (!apiResult || !question) return true; // If we can't validate, allow it
  
  const lowerResult = apiResult.toLowerCase();
  const lowerCandidate = candidate.toLowerCase();
  const lowerQuestion = question.toLowerCase();
  
  // CRITICAL: Check if question contains an "in [Game Title]" pattern
  // If it does, and the candidate is short and doesn't match the game title, we need to be more strict
  // Use the same pattern as extractGameTitleCandidates to ensure consistency
  const inGamePattern = /\b(?:in|for|from|on|of)\s+(?:the\s+)?([A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&\-]+?(?:\s*:\s*[A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&\-]+?)?)(?=\s+(?:how|what|where|when|why|which|who|is|does|do|has|have|can|could|would|should|was|were|will|did)\b|[?.!]|$)/gi;
  const inGameMatches: Array<{ title: string; index: number }> = [];
  let inGameMatch: RegExpExecArray | null;
  
  // Find all "in [Game Title]" patterns in the question (works for both beginning and end)
  while ((inGameMatch = inGamePattern.exec(question)) !== null) {
    if (inGameMatch[1]) {
      let title = inGameMatch[1].trim();
      // Clean up the title (same as extractGameTitleCandidates)
      title = title.replace(/^(?:what|which|where|when|why|how|who|the|a|an)\s+/i, '');
      title = title.replace(/\s+(?:has|have|is|are|does|do|can|could|would|should|was|were|will|did)$/i, '');
      if (title.length >= 3) {
        inGameMatches.push({ title: title.toLowerCase(), index: inGameMatch.index });
      }
    }
  }
  
  // Use the most relevant "in [Game Title]" match (prefer longer titles, or the one closest to the candidate)
  if (inGameMatches.length > 0) {
    // Sort by length (longer = more specific) and then by position
    inGameMatches.sort((a, b) => {
      if (a.title.length !== b.title.length) {
        return b.title.length - a.title.length; // Longer first
      }
      return a.index - b.index; // Earlier position first
    });
    
    const inGameTitle = inGameMatches[0].title;
    const inGameIndex = inGameMatches[0].index;
    const candidateIndex = lowerQuestion.indexOf(lowerCandidate);
    
    // Extract meaningful words from the "in [Game Title]" game title
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'what', 'which', 'where', 'when', 'why', 'how', 'who', 'can', 'could', 'would', 'should',
      'game', 'games', 'play', 'player', 'playing', 'get', 'got', 'how', 'best', 'way'
    ]);
    
    const extractMeaningfulWords = (text: string): Set<string> => {
      return new Set(
        text
          .toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 2 && !commonWords.has(w))
          .map(w => w.replace(/[^a-z0-9]/g, ''))
          .filter(w => w.length > 2)
      );
    };
    
    const inGameTitleWords = extractMeaningfulWords(inGameTitle);
    const resultWords = extractMeaningfulWords(apiResult);
    
    // Check if result shares meaningful words with the "in [Game Title]" game title
    const sharedWords = Array.from(resultWords).filter(w => inGameTitleWords.has(w));
    
    // If candidate is short (1-3 words) and doesn't share meaningful words with the "in [Game Title]" game title
    const wordCount = candidate.split(/\s+/).length;
    if (wordCount <= 3 && candidate.length < 40) {
      // Check if candidate appears before "in [Game Title]" pattern
      if (candidateIndex >= 0 && inGameIndex >= 0 && candidateIndex < inGameIndex) {
        // Candidate appears before "in [Game Title]" - likely a character/enemy/location
        // The API result must share meaningful words with the "in [Game Title]" game title
        if (sharedWords.length === 0) {
          return false; // Reject - result doesn't match the game title mentioned in question
        }
      } else if (candidateIndex >= 0 && inGameIndex >= 0 && candidateIndex > inGameIndex) {
        // Candidate appears after "in [Game Title]" - could be a character/enemy/location
        // If the result doesn't share meaningful words with the "in [Game Title]" game title,
        // and the candidate is short, reject it
        if (wordCount === 1 && sharedWords.length === 0) {
          return false; // Reject single-word candidates that don't match the game title
        }
        // For multi-word candidates after "in [Game Title]" (like "Petey Piranha"), check if any words match
        if (wordCount <= 3 && sharedWords.length === 0) {
          const candidateLower = candidate.toLowerCase();
          const inGameTitleLower = inGameTitle.toLowerCase();
          // Check if any individual word from the candidate appears in the game title
          // This catches cases like "Petey Piranha" where neither word appears in "Mario Superstar Baseball"
          const candidateWords = candidateLower.split(/\s+/).filter(w => w.length > 2);
          const hasMatchingWord = candidateWords.some(word => inGameTitleLower.includes(word));
          
          // If no words from the candidate appear in the game title, it's likely a character/enemy/location
          if (!hasMatchingWord) {
            return false; // Reject - candidate words don't match the game title
          }
        }
      }
    }
  }
  
  // Extract distinctive words from candidate (numbers, remake/remaster, HD, version indicators, sequel indicators)
  // These MUST be present in the result for it to be considered relevant
  const distinctiveWords = lowerCandidate
    .split(/\s+/)
    .filter(w => {
      // Numbers (like "4", "2", "III")
      if (/^\d+$/.test(w) || /^(ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(w)) return true;
      // Remake/remaster indicators
      if (/remake|remaster|reimagined/i.test(w)) return true;
      // Sequel indicators
      if (/world|part|sequel/i.test(w)) return true;
      // Version indicators (HD, 4K, Definitive Edition, etc.)
      if (/^hd$|^4k$|definitive|edition|deluxe|ultimate|complete|collection/i.test(w)) return true;
      return false;
    })
    .map(w => w.replace(/[^a-z0-9]/g, ''));
  
  // If candidate has distinctive words, they MUST appear in the result
  if (distinctiveWords.length > 0) {
    const missingDistinctive = distinctiveWords.some(dw => {
      if (dw.length > 0) {
        // Check if this distinctive word appears in the result
        const wordPattern = new RegExp(`\\b${dw}\\b`, 'i');
        return !wordPattern.test(lowerResult);
      }
      return false;
    });
    
    if (missingDistinctive) {
      // Distinctive word is missing - this is NOT a match
      return false;
    }
  }
  
  // Check for conflicting words - if candidate has "4" and "remake", result shouldn't have "archives" without "4"
  // This catches cases like "Resident Evil 4 Remake" vs "Resident Evil Archives"
  if (lowerCandidate.includes('4') && lowerCandidate.includes('remake')) {
    if (lowerResult.includes('archives') && !lowerResult.includes('4')) {
      return false; // "Archives" without "4" is a different game
    }
  }
  
  // Extract meaningful words from each (filter out common words)
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'what', 'which', 'where', 'when', 'why', 'how', 'who', 'can', 'could', 'would', 'should',
    'game', 'games', 'play', 'player', 'playing', 'get', 'got', 'how', 'best', 'way'
  ]);
  
  const extractMeaningfulWords = (text: string): Set<string> => {
    return new Set(
      text
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2 && !commonWords.has(w))
        .map(w => w.replace(/[^a-z0-9]/g, ''))
        .filter(w => w.length > 2)
    );
  };
  
  const resultWords = extractMeaningfulWords(apiResult);
  const questionWords = extractMeaningfulWords(question);
  const candidateWords = extractMeaningfulWords(candidate);
  
  // Check if result shares words with candidate (strong indicator of relevance)
  const candidateMatches = Array.from(resultWords).filter(w => candidateWords.has(w));
  if (candidateMatches.length >= 2) {
    return true; // Strong match with candidate
  }
  
  // Check if result shares words with question
  const questionMatches = Array.from(resultWords).filter(w => questionWords.has(w));
  
  // For short results (likely game titles), require at least 1 meaningful match
  // For longer results, require at least 2 matches
  const minMatches = apiResult.split(/\s+/).length <= 6 ? 1 : 2;
  
  if (questionMatches.length >= minMatches) {
    return true;
  }
  
  // If no meaningful matches, the result is likely irrelevant
  // Exception: if the candidate itself was very short or generic, be more lenient
  if (candidate.split(/\s+/).length <= 2 && questionMatches.length >= 1) {
    return true;
  }
  
  return false;
}

/**
 * Extract console name from question if it's about a console, not a game
 * Returns console name if detected, undefined otherwise
 */
function extractConsoleFromQuestion(question: string): string | undefined {
  const lowerQuestion = question.toLowerCase();
  
  // Console patterns - check for console-specific questions
  const consolePatterns: { [key: string]: RegExp[] } = {
    'Nintendo Switch 2': [
      /nintendo\s+switch\s+2/i,
      /switch\s+2/i
    ],
    'Nintendo Switch': [
      /nintendo\s+switch(?!\s+2)/i,
      /\bswitch\b(?!\s+2)/i
    ],
    'PlayStation 5': [/playstation\s+5/i, /ps5/i],
    'PlayStation 4': [/playstation\s+4/i, /ps4/i],
    'PlayStation 3': [/playstation\s+3/i, /ps3/i],
    'Xbox Series X': [/xbox\s+series\s+x/i, /xsx/i],
    'Xbox Series S': [/xbox\s+series\s+s/i, /xss/i],
    'Xbox One': [/xbox\s+one/i],
    'Xbox 360': [/xbox\s+360/i],
    'PC': [/\b(pc|steam|epic|gog)\b(?!\s+engine)/i],
    'Wii U': [/wii\s+u/i],
    'Nintendo Wii': [/nintendo\s+wii\b(?!\s+u)/i],
    'GameCube': [/gamecube|game\s+cube/i],
    'Nintendo 64': [/nintendo\s+64|n64/i],
    'Nintendo 3DS': [/nintendo\s+3ds/i],
    'Nintendo DS': [/nintendo\s+ds/i],
    'Nintendo DSi': [/nintendo\s+dsi/i],
    'Nintendo Game Boy': [/nintendo\s+game\s+boy/i],
    'Nintendo Game Boy Advance': [/nintendo\s+game\s+boy\s+advance/i],
    'Nintendo Game Boy Color': [/nintendo\s+game\s+boy\s+color/i],
    'PlayStation Portable': [/playstation\s+portable/i],
    'PlayStation Vita': [/playstation\s+vita/i],
    'PlayStation 2': [/playstation\s+2/i],
    'PlayStation': [/playstation\s/i],
    'Xbox ': [/xbox\s/i],
    'Super Nintendo Entertainment System': [/super\s+nintendo\s+entertainment\s+system/i],
    'Nintendo Entertainment System': [/nintendo\s+entertainment\s+system/i],
    'Sega Genesis': [/sega\s+genesis/i],
    'Sega Saturn': [/sega\s+saturn/i],
    'Sega Dreamcast': [/sega\s+dreamcast/i],
    'Sega Master System': [/sega\s+master\s+system/i],
    'TurboGrafx-16': [/turbo\s+grafx-16/i],
    'Atari 2600': [/atari\s+2600/i],
    'Magnavox Odyssey': [/magnavox\s+odyssey/i],
    'Commodore 64': [/commodore\s+64/i],
    'Amiga': [/amiga/i],
    'PC Engine': [/pc\s+engine|pc-engine|turbo\s*grafx-?16/i],
    'Sega CD': [/sega\s+cd/i],
    'MSX': [/msx/i],
    'ColecoVision': [/coleco\s+vision/i],
    'Intellivision': [/intellivision/i],
    'Neo Geo': [/neo\s+geo/i],
    'Neo Geo Pocket': [/neo\s+geo\s+pocket/i],
    'Sega Game Gear': [/sega\s+game\s+gear/i],
    'Atari Jaguar': [/atari\s+jaguar/i],
    'Virtual Boy': [/virtual\s+boy/i],
    'Arcade': [/arcade/i],
    'Meta Quest 3': [/meta\s+quest\s+3/i],
    'Meta Quest 2': [/meta\s+quest\s+2/i]
  };
  
  // Check if question is about console (price, release date, specs, games available, etc.)
  // First, check if any console patterns match the question
  // Check for console patterns in order of specificity (longer names first)
  const sortedConsoles = Object.entries(consolePatterns).sort((a, b) => b[0].length - a[0].length);
  
  for (const [consoleName, patterns] of sortedConsoles) {
    if (patterns.some(pattern => pattern.test(question))) {
      // Found a console match - verify it's actually about the console, not a game
      // Check for console question indicators (price, release date, specs, games available, etc.)
      const consoleQuestionIndicators = [
        /price|cost|how\s+much|release\s+date|when\s+(was|is|did).*release|specs|specifications|features|console|games?\s+(available|on|for|compatible|playable)|exclusive|backward\s+compatible|backwards\s+compatible/i
      ];
      
      const isConsoleQuestion = consoleQuestionIndicators.some(pattern => pattern.test(question));
      
      // If question has console indicators, definitely return the console
      if (isConsoleQuestion) {
        return consoleName;
      }
      
      // If no explicit indicators but console name is mentioned, check if it's likely about the console
      // vs a game with the same name (e.g., "PlayStation" could be a game or console)
      // For most consoles, if the name appears, it's likely about the console
      // Exception: Generic names like "PC" or "Arcade" might need more context
      if (consoleName === 'PC' || consoleName === 'Arcade') {
        // For PC/Arcade, require console indicators to avoid false positives
        return undefined;
      }
      
      // For specific console names, return the console
      return consoleName;
    }
  }
  
  return undefined;
}

/**
 * Extract potential game title candidates from question text
 * Returns an array of candidate strings that might be game titles
 */
function extractGameTitleCandidates(question: string): string[] {
  if (!question || question.length < 3) return [];

  const candidates: string[] = [];

  // Strategy 1: Quoted game titles (most reliable)
  const quotedMatch = question.match(/["']([^"']+)["']/i);
  if (quotedMatch && quotedMatch[1].trim().length >= 3) {
    candidates.push(quotedMatch[1].trim());
  }
  
  // Strategy 1.5: "When was [Game Title] released?" pattern
  // This captures the full game title including numbers and remake indicators
  const whenWasPattern = /when\s+(?:was|is|did)\s+([A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&-]+?)\s+(?:released|come\s+out|launched)/i;
  const whenWasMatch = question.match(whenWasPattern);
  if (whenWasMatch && whenWasMatch[1]) {
    let candidate = whenWasMatch[1].trim();
    // Remove leading "the" if present
    candidate = candidate.replace(/^the\s+/i, '');
    if (candidate.length >= 3) {
      candidates.push(candidate);
    }
  }

  // Strategy 2: "in [Game Title]", "for [Game Title]", "of [Game Title]" patterns
  // Updated to handle special characters (é, ü, ö, ō, etc.) and roman numerals (X, Y, III, etc.)
  // Improved to stop at common verbs and question words to avoid capturing too much
  // Character class includes: À-ÿ (Latin-1), Ā-ž (Latin Extended-A), and common Unicode letters
  // Added "of" to catch patterns like "versions of Deisim", "differences between versions of [Game]"
  // IMPORTANT: Preserve remake/remaster/sequel indicators and version indicators (Remake, Remaster, HD, 2, World 2, II, etc.)
  // CRITICAL: Capture full game titles including colons and subtitles (e.g., "The Legend of Zelda: Breath of the Wild")
  // CRITICAL: Also capture titles with subtitles that don't use colons (e.g., "Super Mario Bros. Wonder")
  // Pattern: "in [Title]: [Subtitle]" or "in [Title] [Subtitle]" - captures up to question mark, period, or end of string
  // IMPORTANT: Pattern explicitly handles colons - captures "Title: Subtitle" as a single candidate
  // IMPORTANT: Pattern also captures titles with space-separated subtitles (e.g., "Super Mario Bros. Wonder")
  // The pattern captures: "in The Legend of Zelda: Breath of the Wild" -> "The Legend of Zelda: Breath of the Wild"
  // The pattern captures: "in Super Mario Bros. Wonder" -> "Super Mario Bros. Wonder"
  // CRITICAL: Use greedy matching to capture the longest possible title including subtitles
  // The pattern captures everything from "in" until a question mark, period, or end of string
  // For questions ending with "?", capture everything up to the "?" (e.g., "in Super Mario Bros. Wonder?")
  // Use greedy matching to capture the full title including subtitles (change +? to + for greedy)
  const inGamePattern = /\b(?:in|for|from|on|of)\s+(?:the\s+)?([A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s'&\-:]+)(?=\s+(?:how|what|where|when|why|which|who|is|does|do|has|have|can|could|would|should|was|were|will|did)\b|[?.!]|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = inGamePattern.exec(question)) !== null) {
    if (match[1]) {
      let candidate = match[1].trim();
      // Remove leading question words
      candidate = candidate.replace(/^(?:what|which|where|when|why|how|who|the|a|an)\s+/i, '');
      // Remove trailing verbs and question words
      candidate = candidate.replace(/\s+(?:has|have|is|are|does|do|can|could|would|should|was|were|will|did)$/i, '');
      // Remove any text before "in" if it was accidentally captured (e.g., "kart has" before "in")
      const inIndex = candidate.toLowerCase().indexOf(' in ');
      if (inIndex > 0) {
        candidate = candidate.substring(inIndex + 4).trim();
      }
      
      if (candidate.length >= 3 && !/^(what|which|where|when|why|how|who)$/i.test(candidate)) {
        // Check for non-game indicators (phrases that indicate this isn't a game title)
        const lowerCandidate = candidate.toLowerCase();
        // Filter out common non-game phrases
        const nonGamePhrases = [
          'kart has', 'is the', 'best way', 'battle and catch', 'has the', 'has highest',
          'has best', 'has the lowest', 'has the worst', 'CTGP', 'has the slowest',
          'has the easiest', 'has the hardest', 'gameplay mechanics', 'mechanics',
          'gameplay', 'different versions', 'versions', 'key differences', 'differences',
          'between', 'version', 'edition', 'editions', 'location', 'item'
        ];
        
        const isNonGamePhrase = nonGamePhrases.some(phrase => lowerCandidate.includes(phrase));
        
        // Also check if it's a very generic phrase (all lowercase common words)
        const isGenericPhrase = /^(the|a|an|this|that|these|those|some|any|all|each|every)\s+/i.test(candidate) &&
                                candidate.split(/\s+/).length <= 3;
        
        if (!isNonGamePhrase && !isGenericPhrase) {
          candidates.push(candidate);
        }
      }
    }
  }

  // Strategy 2.5: "versions of [Game]", "differences between...of [Game]" patterns
  // This catches cases like "differences between versions of Deisim"
  const ofGamePattern = /\b(?:versions?|editions?|differences?|between|comparison|compare)\s+(?:between\s+)?(?:the\s+)?(?:different\s+)?(?:versions?|editions?)\s+of\s+([A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&-]+?)(?:\s*$|[?.!])/gi;
  while ((match = ofGamePattern.exec(question)) !== null) {
    if (match[1]) {
      let candidate = match[1].trim();
      // Clean up trailing words
      candidate = candidate.replace(/\s+(?:how|what|where|when|why|which|who|is|does|do|has|have|can|could|would|should|was|were|will|did)$/i, '');
      if (candidate.length >= 3 && candidate.length <= 50) {
        const lowerCandidate = candidate.toLowerCase();
        // Filter out non-game phrases
        if (!lowerCandidate.includes('gameplay mechanics') && 
            !lowerCandidate.includes('mechanics') &&
            !lowerCandidate.includes('gameplay')) {
          candidates.push(candidate);
        }
      }
    }
  }

  // Strategy 3: Proper noun patterns (capitalized words, including special chars, numbers, and remake indicators)
  // Also matches patterns like "Pokémon X and Y", "Final Fantasy VII", "God of War Ragnarök", "Resident Evil 4 Remake"
  // Character class includes: À-ÿ (Latin-1), Ā-ž (Latin Extended-A) for characters like ö, ō
  // IMPORTANT: Include numbers, remake/remaster indicators, and version indicators (HD, 4K, etc.) in the pattern
  // CRITICAL: Filter out candidates that appear before "in [Game Title]" patterns - these are likely locations/characters/items
  const properNounPattern = /\b([A-ZÀ-ÿĀ-ž][a-zÀ-ÿĀ-ž]+(?:\s+(?:[A-ZÀ-ÿĀ-ž][a-zÀ-ÿĀ-ž]+|[IVXLCDM]+|\d+|Remake|Remaster|Reimagined|HD|4K|Definitive|Edition|Deluxe|Ultimate|Complete|Collection|Final\s+Mix|Re:|DS|Switch|Combo|Pack|Legacy|Anniversary|\band\b)){1,6})\b/g;
  const properNounMatches: Array<{ candidate: string; index: number }> = [];
  
  // First, find all "in [Game Title]" patterns to identify what comes after them
  const inGamePatternIndices: number[] = [];
  const inGameCheckRegex = /\b(?:in|for|from|on|of)\s+(?:the\s+)?[A-ZÀ-ÿĀ-ž]/gi;
  let inGameCheckMatch: RegExpExecArray | null;
  while ((inGameCheckMatch = inGameCheckRegex.exec(question)) !== null) {
    inGamePatternIndices.push(inGameCheckMatch.index);
  }
  
  while ((match = properNounPattern.exec(question)) !== null) {
    if (match[1]) {
      let candidate = match[1].trim();
      // Skip if it's at the start of a sentence (likely not a game)
      const candidateIndex = question.indexOf(candidate);
      if (candidateIndex > 0 && candidate.length >= 3) {
        // CRITICAL: If this candidate appears before an "in [Game Title]" pattern,
        // and the candidate is short (1-3 words), it's likely a location/character/item, not a game
        const wordCount = candidate.split(/\s+/).length;
        const isShortCandidate = wordCount <= 3 && candidate.length < 40;
        
        // Check if there's an "in [Game Title]" pattern after this candidate
        const hasInGamePatternAfter = inGamePatternIndices.some(inGameIndex => 
          inGameIndex > candidateIndex && inGameIndex < candidateIndex + candidate.length + 50
        );
        
        // Skip short candidates that appear before "in [Game Title]" patterns
        if (isShortCandidate && hasInGamePatternAfter) {
          continue; // Skip this candidate - it's likely not a game title
        }
        
        // Filter out common question starters and non-game phrases
        const lowerCandidate = candidate.toLowerCase();
        if (!/^(How|What|Where|When|Why|Which|Who)\s+/.test(candidate) &&
            !lowerCandidate.includes('gameplay mechanics') &&
            !lowerCandidate.includes('mechanics') &&
            !lowerCandidate.includes('gameplay') &&
            !lowerCandidate.includes('versions') &&
            !lowerCandidate.includes('differences')) {
          properNounMatches.push({ candidate, index: candidateIndex });
        }
      }
    }
  }
  
  // Sort by position (later in question = more likely to be game title) and add to candidates
  properNounMatches.sort((a, b) => b.index - a.index);
  for (const match of properNounMatches) {
    candidates.push(match.candidate);
  }

  // Strategy 4: Extract from "What [item] in [game]?" patterns (with special char support)
  // Improved to better handle cases where the game title might have extra text before it
  // Character class includes: À-ÿ (Latin-1), Ā-ž (Latin Extended-A) for characters like ö, ō
  const itemInGameMatch = question.match(/(?:what|which|where|how).+?\bin\s+(?:the\s+)?([A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&-]{3,50})(?:\??\s*$|[?.!])/i);
  if (itemInGameMatch && itemInGameMatch[1]) {
    let candidate = itemInGameMatch[1].trim();
    // Clean up common endings
    candidate = candidate.replace(/\s+(?:how|what|where|when|why|which|who)$/i, '');
    // Remove any text that looks like it's part of the question, not the game title
    // If candidate contains verbs like "has", "is", etc., try to extract just the game part
    const verbPattern = /\s+(?:has|have|is|are|does|do|can|could|would|should|was|were|will|did)\s+/i;
    const verbMatch = candidate.match(verbPattern);
    if (verbMatch && verbMatch.index !== undefined) {
      // If we find a verb, the game title is likely after it
      // But actually, if there's a verb, the game is probably before "in"
      // So this candidate might be malformed - skip it or try to clean it
      const beforeVerb = candidate.substring(0, verbMatch.index).trim();
      // If what's before the verb is short and looks like a game title, use it
      // Check for uppercase letter or special character (À-ÿ, Ā-ž)
      if (beforeVerb.length >= 3 && beforeVerb.length <= 30 && /^[A-ZÀ-ÿĀ-ž]/.test(beforeVerb)) {
        candidate = beforeVerb;
      }
    }
    if (candidate.length >= 3 && candidate.length <= 50) {
      // Additional check: if candidate contains common question phrases, it's probably wrong
      const lowerCandidate = candidate.toLowerCase();
      if (!lowerCandidate.includes('has the') && 
          !lowerCandidate.includes('has highest') &&
          !lowerCandidate.includes('has best') &&
          !lowerCandidate.includes('kart has') &&
          !lowerCandidate.includes('has the lowest') &&
          !lowerCandidate.includes('has the worst') &&
          !lowerCandidate.includes('has the slowest') &&
          !lowerCandidate.includes('has the easiest') &&
          !lowerCandidate.includes('has the hardest')) {
        candidates.push(candidate);
      }
    }
  }

  // Strategy 5: Specific pattern for "Pokémon X and Y", "Final Fantasy VII" style titles
  // Matches: [Name] [Letter/Numeral] and [Letter/Numeral]
  // Character class includes: À-ÿ (Latin-1), Ā-ž (Latin Extended-A) for characters like ö, ō
  const versionedGamePattern = /\b([A-ZÀ-ÿĀ-ž][a-zÀ-ÿĀ-ž]+)\s+([A-ZIVXLCDM]+)\s+and\s+([A-ZIVXLCDM]+)\b/gi;
  while ((match = versionedGamePattern.exec(question)) !== null) {
    if (match[1] && match[2] && match[3]) {
      const candidate = `${match[1]} ${match[2]} and ${match[3]}`;
      if (candidate.length >= 5 && candidate.length <= 60) {
        candidates.push(candidate);
      }
    }
  }

  // Remove duplicates and filter candidates
  let uniqueCandidates = Array.from(new Set(candidates))
    .filter(c => c.length >= 3 && c.length <= 60)
    .filter(c => !isLikelyQuestionWord(c))
    .filter(c => isValidGameTitleCandidate(c));
  
  if (uniqueCandidates.length === 0) {
    return [];
  }
  
  // Identify which candidates came from "in [Game Title]" pattern (highest priority)
  const inGamePatternCandidates = new Set<string>();
  // Match "in [Game Title]" pattern - extract the game title part
  // IMPORTANT: Use greedy matching for subtitle part to capture full titles with colons
  // Keep colon in character class to allow titles with colons
  const inGamePatternRegex = /\b(?:in|for|from|on|of)\s+(?:the\s+)?([A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&\-]+?(?:\s*:\s*[A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&\-]+)?(?:\s+(?:Remake|Remaster|Reimagined|HD|4K|Definitive|Edition|Deluxe|Ultimate|Complete|Collection|Final\s+Mix|Re:|DS|Switch|Combo|Pack|Legacy|Anniversary|2|II|3|III|4|IV|World\s*2|World\s*II))?)(?:\s+(?:how|what|where|when|why|which|who|is|does|do|has|have|can|could|would|should|was|were|will|did)|$|[?.!])/gi;
  let inGameMatch: RegExpExecArray | null;
  while ((inGameMatch = inGamePatternRegex.exec(question)) !== null) {
    if (inGameMatch[1]) {
      let candidate = inGameMatch[1].trim();
      candidate = candidate.replace(/^(?:what|which|where|when|why|how|who|the|a|an)\s+/i, '');
      candidate = candidate.replace(/\s+(?:has|have|is|are|does|do|can|could|would|should|was|were|will|did)$/i, '');
      if (candidate.length >= 3) {
        // Normalize for comparison (case-insensitive)
        const normalized = candidate.toLowerCase();
        uniqueCandidates.forEach(c => {
          if (c.toLowerCase() === normalized || c.toLowerCase().includes(normalized) || normalized.includes(c.toLowerCase())) {
            inGamePatternCandidates.add(c);
          }
        });
      }
    }
  }
  
  // Detect candidates that appear BEFORE "in [Game Title]" pattern (likely characters/enemies/locations)
  const likelyCharacterNames = new Set<string>();
  const questionLowerForChars = question.toLowerCase();
  uniqueCandidates.forEach(candidate => {
    const candidateLower = candidate.toLowerCase();
    const candidateIndex = questionLowerForChars.indexOf(candidateLower);
    
    // Check if this candidate appears before an "in [Game Title]" pattern
    const inPatternAfter = /\bin\s+(?:the\s+)?([A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&-]+)/i;
    const afterMatch = question.substring(candidateIndex + candidate.length).match(inPatternAfter);
    
    if (afterMatch && candidateIndex >= 0) {
      // This candidate appears before "in [Game Title]" - likely a character/enemy/location
      // Only mark as likely character if it's short (1-2 words) and not a known game title pattern
      const wordCount = candidate.split(/\s+/).length;
      if (wordCount <= 2 && candidate.length < 30) {
        likelyCharacterNames.add(candidate);
      }
    }
  });
  
  // Separate candidates into single-word and multi-word
  const singleWordCandidates = uniqueCandidates.filter(c => c.split(/\s+/).length === 1);
  const multiWordCandidates = uniqueCandidates.filter(c => c.split(/\s+/).length > 1);
  
  // If we have multi-word candidates, prefer them over single-word candidates
  // Single words are often game content (items, ingredients, etc.) not game titles
  let prioritizedCandidates: string[];
  if (multiWordCandidates.length > 0) {
    // Use multi-word candidates, but also include single-word candidates that look like proper nouns
    // (start with capital letter and are reasonably long - might be game titles like "Deisim")
    const validSingleWords = singleWordCandidates.filter(c => {
      const words = c.split(/\s+/);
      // Only keep single words that:
      // 1. Start with capital letter (proper noun)
      // 2. Are at least 5 characters (unlikely to be common words)
      // 3. Don't look like common nouns (not in common word lists)
      return words.length === 1 && 
             /^[A-ZÀ-ÿĀ-ž]/.test(c) && 
             c.length >= 5 &&
             !isCommonNoun(c);
    });
    prioritizedCandidates = [...multiWordCandidates, ...validSingleWords];
  } else {
    // Only single-word candidates available, use them but be more strict
    prioritizedCandidates = singleWordCandidates.filter(c => {
      const words = c.split(/\s+/);
      // Only keep if it's a proper noun and reasonably long
      return words.length === 1 && 
             /^[A-ZÀ-ÿĀ-ž]/.test(c) && 
             c.length >= 5 &&
             !isCommonNoun(c);
    });
  }
  
  // CRITICAL: Filter out candidates that appear BEFORE "in [Game Title]" patterns
  // These are almost always characters/enemies/locations, not game titles
  // Only exclude if there's an "in [Game Title]" candidate available
  const hasInGamePatternCandidate = prioritizedCandidates.some(c => inGamePatternCandidates.has(c));
  
  if (hasInGamePatternCandidate) {
    // If we have an "in [Game Title]" candidate, exclude short candidates that appear before it
    prioritizedCandidates = prioritizedCandidates.filter(candidate => {
      // Always keep "in [Game Title]" candidates
      if (inGamePatternCandidates.has(candidate)) {
        return true;
      }
      
      // Exclude candidates that appear before "in [Game Title]" patterns if they're short
      if (likelyCharacterNames.has(candidate)) {
        return false; // Completely exclude these
      }
      
      // Also check if candidate appears before any "in [Game Title]" pattern
      const candidateLower = candidate.toLowerCase();
      const candidateIndex = questionLowerForChars.indexOf(candidateLower);
      
      if (candidateIndex >= 0) {
        const textAfter = question.substring(candidateIndex + candidate.length);
        const inPatternAfter = /\bin\s+(?:the\s+)?([A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&-]{5,})/i;
        const afterMatch = textAfter.match(inPatternAfter);
        
        if (afterMatch) {
          // Candidate appears before "in [Game Title]" pattern
          const wordCount = candidate.split(/\s+/).length;
          // Exclude if short (1-3 words) and not very long
          if (wordCount <= 3 && candidate.length < 40) {
            return false; // Exclude short candidates before "in [Game Title]"
          }
        }
      }
      
      return true;
    });
  }
  
  // Prioritize candidates with intelligent scoring
  // Score based on: 1) Pattern match (in [Game Title] = highest), 2) Not a character name, 3) Word count, 4) Length, 5) Position
  prioritizedCandidates = prioritizedCandidates
    .map(candidate => {
      const candidateLower = candidate.toLowerCase();
      const position = questionLowerForChars.indexOf(candidateLower);
      const wordCount = candidate.split(/\s+/).length;
      const length = candidate.length;
      
      // Calculate score
      let score = 0;
      
      // Highest priority: Candidates from "in [Game Title]" pattern
      if (inGamePatternCandidates.has(candidate)) {
        score += 10000; // Much higher priority to ensure they're tried first
      }
      
      // Penalty: Candidates that are likely character/enemy/location names
      if (likelyCharacterNames.has(candidate)) {
        score -= 5000; // Much larger penalty
      }
      
      // Bonus for longer, more complete titles (likely full game titles)
      score += wordCount * 10; // More words = higher score
      score += length; // Longer = higher score
      
      // Small bonus for appearing later in question (but much less important than pattern match)
      score += (position / 10);
      
      return {
        candidate,
        score,
        wordCount,
        length,
        position
      };
    })
    .sort((a, b) => {
      // Sort by score (highest first)
      return b.score - a.score;
    })
    .map(item => item.candidate);
  
  return prioritizedCandidates;
}

/**
 * Extract game title from question text using IGDB and RAWG APIs for verification
 * This eliminates the need for hardcoded game title lists
 * Also detects consoles if the question is about a console, not a game
 */
export async function extractGameTitleFromQuestion(question: string): Promise<string | undefined> {
  if (!question || question.length < 3) {
    // console.log('[Game Title] Question too short');
    return undefined;
  }

  // Skip game title extraction for recommendation questions
  // These are general questions about game recommendations, not about specific games
  const lowerQuestion = question.toLowerCase();
  const isRecommendationQuestion = 
    /best\s+.*?\s+games?\s+(for|right now|currently|to play|that|which)/i.test(question) ||
    /what\s+(are|is)\s+the\s+best\s+.*?\s+games?/i.test(question) ||
    /recommend.*?\s+(me\s+)?(some|a|the\s+best)\s+.*?\s+games?/i.test(question) ||
    /what\s+(should|game)\s+(should|can)\s+i\s+play/i.test(question) ||
    /give\s+me\s+(a\s+)?(random\s+)?game\s+recommendation/i.test(question);
  
  if (isRecommendationQuestion) {
    // console.log('[Game Title] Skipping extraction for recommendation question');
    return undefined;
  }

  // First, check if this is a console question
  const detectedConsole = extractConsoleFromQuestion(question);
  if (detectedConsole) {
    console.log(`[Game Title] Detected console: ${detectedConsole}`);
    return detectedConsole;
  }

  try {
    // Extract potential game title candidates
    let candidates = extractGameTitleCandidates(question);
    
    if (candidates.length === 0) {
      // console.log('[Game Title] No candidates extracted from question');
      return undefined;
    }

    // Candidates are already prioritized by extractGameTitleCandidates
    // (prioritizes "in [Game Title]" patterns, penalizes character names, etc.)
    
    // console.log(`[Game Title] Extracted ${candidates.length} candidate(s):`, candidates);

    // Try each candidate against IGDB and RAWG APIs
    // Validate candidates before API calls to avoid unnecessary requests
    let validCandidates = candidates.filter(c => isValidGameTitleCandidate(c));
    
    // CRITICAL: Identify candidates from "in [Game Title]" patterns
    // These should be tried FIRST, before any other candidates
    // IMPORTANT: Updated regex to capture full game titles including colons (e.g., "The Legend of Zelda: Breath of the Wild")
    const inGamePatternCandidates = new Set<string>();
    const inGamePatternRegex = /\b(?:in|for|from|on|of)\s+(?:the\s+)?([A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&\-]+?(?:\s*:\s*[A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&\-]+?)?(?:\s+(?:Remake|Remaster|Reimagined|HD|4K|Definitive|Edition|Deluxe|Ultimate|Complete|Collection|Final\s+Mix|Re:|DS|Switch|Combo|Pack|Legacy|Anniversary|2|II|3|III|4|IV|World\s*2|World\s*II))?)(?:\s+(?:how|what|where|when|why|which|who|is|does|do|has|have|can|could|would|should|was|were|will|did)|$|[?.!])/gi;
    let inGameMatch: RegExpExecArray | null;
    while ((inGameMatch = inGamePatternRegex.exec(question)) !== null) {
      if (inGameMatch[1]) {
        let candidate = inGameMatch[1].trim();
        candidate = candidate.replace(/^(?:what|which|where|when|why|how|who|the|a|an)\s+/i, '');
        candidate = candidate.replace(/\s+(?:has|have|is|are|does|do|can|could|would|should|was|were|will|did)$/i, '');
        if (candidate.length >= 3) {
          const normalized = candidate.toLowerCase();
          validCandidates.forEach(c => {
            const cLower = c.toLowerCase();
            if (cLower === normalized || cLower.includes(normalized) || normalized.includes(cLower)) {
              inGamePatternCandidates.add(c);
            }
          });
        }
      }
    }
    
    // Reorder candidates: "in [Game Title]" candidates FIRST
    if (inGamePatternCandidates.size > 0) {
      const inGameCandidates = validCandidates.filter(c => inGamePatternCandidates.has(c));
      const otherCandidates = validCandidates.filter(c => !inGamePatternCandidates.has(c));
      validCandidates = [...inGameCandidates, ...otherCandidates];
    }
    
    // CRITICAL: Prioritize longer, more specific candidates
    // If one candidate contains another (e.g., "Super Mario Bros. Wonder" contains "Super Mario Bros."),
    // try the longer one first as it's more specific
    validCandidates.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      
      // If one contains the other, prioritize the longer one
      if (aLower.includes(bLower) && a.length > b.length) {
        return -1; // a comes first
      }
      if (bLower.includes(aLower) && b.length > a.length) {
        return 1; // b comes first
      }
      
      // Otherwise, sort by length (longer first) for more specific matches
      return b.length - a.length;
    });
    
    // Additional validation: If we have multiple candidates, check if first candidate
    // appears before an "in [Game Title]" pattern (likely a character/enemy/location)
    if (validCandidates.length > 1) {
      const firstCandidate = validCandidates[0];
      const lowerQuestion = question.toLowerCase();
      const firstCandidateLower = firstCandidate.toLowerCase();
      const firstCandidateIndex = lowerQuestion.indexOf(firstCandidateLower);
      
      // Check if there's an "in [Game Title]" pattern after this candidate
      if (firstCandidateIndex >= 0 && !inGamePatternCandidates.has(firstCandidate)) {
        const textAfter = question.substring(firstCandidateIndex + firstCandidate.length);
        // Updated regex to capture full game titles including colons
        const inGamePatternAfter = /\bin\s+(?:the\s+)?([A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&\-]+?(?:\s*:\s*[A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&\-]+?)?)/i;
        const afterMatch = textAfter.match(inGamePatternAfter);
        
        // If first candidate is short (1-3 words) and there's a longer candidate after "in",
        // skip the first candidate entirely (it's likely a character/enemy/location)
        if (afterMatch && afterMatch[1]) {
          const wordCount = firstCandidate.split(/\s+/).length;
          const afterCandidateWordCount = afterMatch[1].trim().split(/\s+/).length;
          // Remove short candidates (1-3 words) that appear before longer "in [Game Title]" candidates
          if (wordCount <= 3 && firstCandidate.length < 40 && afterCandidateWordCount > wordCount) {
            // Remove this candidate from the list - it's likely not a game title
            validCandidates = validCandidates.filter(c => c !== firstCandidate);
          }
        }
      }
    }
    
    for (const candidate of validCandidates) {
      // console.log(`[Game Title] Trying candidate: "${candidate}"`);
      
      // CRITICAL: If this candidate appears before an "in [Game Title]" pattern and is short,
      // and we have an "in [Game Title]" candidate available, skip this candidate entirely
      if (!inGamePatternCandidates.has(candidate)) {
        const candidateLower = candidate.toLowerCase();
        const candidateIndex = question.toLowerCase().indexOf(candidateLower);
        
        if (candidateIndex >= 0) {
          const textAfter = question.substring(candidateIndex + candidate.length);
          // Updated regex to capture full game titles including colons
          const inGamePatternAfter = /\bin\s+(?:the\s+)?([A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&\-]+?(?:\s*:\s*[A-ZÀ-ÿĀ-ž][A-Za-z0-9À-ÿĀ-ž\s:'&\-]+?)?)/i;
          const afterMatch = textAfter.match(inGamePatternAfter);
          
          if (afterMatch && afterMatch[1] && inGamePatternCandidates.size > 0) {
            // This candidate appears before "in [Game Title]" and we have "in [Game Title]" candidates
            const wordCount = candidate.split(/\s+/).length;
            const afterCandidateWordCount = afterMatch[1].trim().split(/\s+/).length;
            // Skip short candidates (1-3 words) that appear before longer "in [Game Title]" candidates
            if (wordCount <= 3 && candidate.length < 40 && afterCandidateWordCount > wordCount) {
              // Skip this candidate - it's likely a character/enemy/location, not a game title
              continue;
            }
          }
        }
      }
      
      // Try IGDB first
      try {
        const igdbMatch = await searchGameInIGDB(candidate);
        if (igdbMatch) {
          // CRITICAL: If this is a short candidate and we have "in [Game Title]" candidates,
          // validate that the API result is actually a game, not game content
          if (!inGamePatternCandidates.has(candidate) && inGamePatternCandidates.size > 0) {
            const wordCount = candidate.split(/\s+/).length;
            if (wordCount <= 3 && candidate.length < 40) {
              // This is a short candidate that appears before "in [Game Title]"
              // The API result might be game content (boss, character, etc.), not a game
              // Skip this result and try the "in [Game Title]" candidates instead
              continue;
            }
          }
          // STRICT VALIDATION: Check if distinctive words from candidate are in the result
          const candidateLower = candidate.toLowerCase();
          const resultLower = igdbMatch.toLowerCase();
          
          // Extract distinctive words (numbers, remake/remaster, HD, version indicators, sequel indicators)
          const distinctiveWords = candidateLower
            .split(/\s+/)
            .filter(w => {
              if (/^\d+$/.test(w) || /^(ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(w)) return true;
              if (/remake|remaster|reimagined/i.test(w)) return true;
              if (/world|part|sequel/i.test(w)) return true;
              if (/^hd$|^4k$|definitive|edition|deluxe|ultimate|complete|collection/i.test(w)) return true;
              return false;
            })
            .map(w => w.replace(/[^a-z0-9]/g, ''));
          
          // If candidate has distinctive words, they MUST be in the result
          if (distinctiveWords.length > 0) {
            const missingDistinctive = distinctiveWords.some(dw => {
              if (dw.length > 0) {
                const wordPattern = new RegExp(`\\b${dw}\\b`, 'i');
                return !wordPattern.test(resultLower);
              }
              return false;
            });
            
            if (missingDistinctive) {
              // console.log(`[Game Title] Rejecting IGDB result - missing distinctive words: "${igdbMatch}" vs candidate "${candidate}"`);
              continue; // Try next candidate
            }
          }
          
          // Check for conflicting patterns (e.g., "Archives" when candidate has "4 Remake")
          if (candidateLower.includes('4') && candidateLower.includes('remake')) {
            if (resultLower.includes('archives') && !resultLower.includes('4')) {
              // console.log(`[Game Title] Rejecting IGDB result - conflicting pattern: "${igdbMatch}"`);
              continue;
            }
          }
          
          // Validate that the API result doesn't contain unexpected words
          if (!isValidAPIResult(igdbMatch, candidate)) {
            // console.log(`[Game Title] Rejecting IGDB result with unexpected words: "${igdbMatch}"`);
            continue; // Try next candidate
          }
          
          // Validate that the API result is relevant to the question
          if (!isAPIResultRelevantToQuestion(igdbMatch, question, candidate)) {
            // console.log(`[Game Title] Rejecting IGDB result as irrelevant to question: "${igdbMatch}"`);
            continue; // Try next candidate
          }
          
          // Additional validation: reject if API returned a bundle and we can extract base game
          if (isBundleOrDLC(igdbMatch)) {
            // Check which specific game from the bundle is mentioned in the question
            const relevantGame = findRelevantGameFromBundle(igdbMatch, question);
            if (relevantGame && relevantGame !== igdbMatch && isValidGameTitleCandidate(relevantGame)) {
              // Try to find the specific game in a follow-up search
              const specificGameMatch = await searchGameInIGDB(relevantGame);
              if (specificGameMatch && !isBundleOrDLC(specificGameMatch) && 
                  isValidAPIResult(specificGameMatch, relevantGame) &&
                  isAPIResultRelevantToQuestion(specificGameMatch, question, relevantGame)) {
                // console.log(`[Game Title] Found specific game from bundle in IGDB: "${candidate}" -> "${specificGameMatch}"`);
                return normalizeGameTitle(specificGameMatch);
              }
              // If no match found, use the relevant game we extracted (validate it first)
              if (isValidAPIResult(relevantGame, candidate) && 
                  isAPIResultRelevantToQuestion(relevantGame, question, candidate)) {
                // console.log(`[Game Title] Found match in IGDB (extracted from bundle): "${candidate}" -> "${relevantGame}"`);
                return normalizeGameTitle(relevantGame);
              }
            }
            // Fallback to base game extraction if relevance check fails
            const baseGame = extractBaseGameFromBundle(igdbMatch);
            if (baseGame !== igdbMatch && isValidGameTitleCandidate(baseGame)) {
              // Try to find the base game in a follow-up search
              const baseGameMatch = await searchGameInIGDB(baseGame);
              if (baseGameMatch && !isBundleOrDLC(baseGameMatch) && 
                  isValidAPIResult(baseGameMatch, baseGame) &&
                  isAPIResultRelevantToQuestion(baseGameMatch, question, baseGame)) {
                // console.log(`[Game Title] Found base game in IGDB: "${candidate}" -> "${baseGameMatch}"`);
                return normalizeGameTitle(baseGameMatch);
              }
              // If no base game found, use cleaned version (validate it first)
              if (isValidAPIResult(baseGame, candidate) && 
                  isAPIResultRelevantToQuestion(baseGame, question, candidate)) {
                // console.log(`[Game Title] Found match in IGDB (cleaned from bundle): "${candidate}" -> "${baseGame}"`);
                return normalizeGameTitle(baseGame);
              }
            }
          }
          // console.log(`[Game Title] Found match in IGDB: "${candidate}" -> "${igdbMatch}"`);
          // Normalize the title (e.g., ensure "The Legend of Zelda" has "The")
          return normalizeGameTitle(igdbMatch);
        }
      } catch (error) {
        // Only log errors, not failures
        // console.log(`[Game Title] IGDB search failed for "${candidate}":`, error instanceof Error ? error.message : 'Unknown error');
      }

      // Try RAWG as fallback
      try {
        const rawgMatch = await searchGameInRAWG(candidate);
        if (rawgMatch) {
          // CRITICAL: If this is a short candidate and we have "in [Game Title]" candidates,
          // validate that the API result is actually a game, not game content
          if (!inGamePatternCandidates.has(candidate) && inGamePatternCandidates.size > 0) {
            const wordCount = candidate.split(/\s+/).length;
            if (wordCount <= 3 && candidate.length < 40) {
              // This is a short candidate that appears before "in [Game Title]"
              // The API result might be game content (boss, character, etc.), not a game
              // Skip this result and try the "in [Game Title]" candidates instead
              continue;
            }
          }
          // STRICT VALIDATION: Check if distinctive words from candidate are in the result
          const candidateLower = candidate.toLowerCase();
          const resultLower = rawgMatch.toLowerCase();
          
          // Extract distinctive words (numbers, remake/remaster, HD, version indicators, sequel indicators)
          const distinctiveWords = candidateLower
            .split(/\s+/)
            .filter(w => {
              if (/^\d+$/.test(w) || /^(ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(w)) return true;
              if (/remake|remaster|reimagined/i.test(w)) return true;
              if (/world|part|sequel/i.test(w)) return true;
              if (/^hd$|^4k$|definitive|edition|deluxe|ultimate|complete|collection/i.test(w)) return true;
              return false;
            })
            .map(w => w.replace(/[^a-z0-9]/g, ''));
          
          // If candidate has distinctive words, they MUST be in the result
          if (distinctiveWords.length > 0) {
            const missingDistinctive = distinctiveWords.some(dw => {
              if (dw.length > 0) {
                const wordPattern = new RegExp(`\\b${dw}\\b`, 'i');
                return !wordPattern.test(resultLower);
              }
              return false;
            });
            
            if (missingDistinctive) {
              // console.log(`[Game Title] Rejecting RAWG result - missing distinctive words: "${rawgMatch}" vs candidate "${candidate}"`);
              continue; // Try next candidate
            }
          }
          
          // Check for conflicting patterns
          if (candidateLower.includes('4') && candidateLower.includes('remake')) {
            if (resultLower.includes('archives') && !resultLower.includes('4')) {
              // console.log(`[Game Title] Rejecting RAWG result - conflicting pattern: "${rawgMatch}"`);
              continue;
            }
          }
          
          // Validate that the API result doesn't contain unexpected words
          if (!isValidAPIResult(rawgMatch, candidate)) {
            // console.log(`[Game Title] Rejecting RAWG result with unexpected words: "${rawgMatch}"`);
            continue; // Try next candidate
          }
          
          // Validate that the API result is relevant to the question
          if (!isAPIResultRelevantToQuestion(rawgMatch, question, candidate)) {
            // console.log(`[Game Title] Rejecting RAWG result as irrelevant to question: "${rawgMatch}"`);
            continue; // Try next candidate
          }
          
          // Additional validation: reject if API returned a bundle and we can extract base game
          if (isBundleOrDLC(rawgMatch)) {
            // Check which specific game from the bundle is mentioned in the question
            const relevantGame = findRelevantGameFromBundle(rawgMatch, question);
            if (relevantGame && relevantGame !== rawgMatch && isValidGameTitleCandidate(relevantGame)) {
              // Try to find the specific game in a follow-up search
              const specificGameMatch = await searchGameInRAWG(relevantGame);
              if (specificGameMatch && !isBundleOrDLC(specificGameMatch) && 
                  isValidAPIResult(specificGameMatch, relevantGame) &&
                  isAPIResultRelevantToQuestion(specificGameMatch, question, relevantGame)) {
                // console.log(`[Game Title] Found specific game from bundle in RAWG: "${candidate}" -> "${specificGameMatch}"`);
                return normalizeGameTitle(specificGameMatch);
              }
              // If no match found, use the relevant game we extracted (validate it first)
              if (isValidAPIResult(relevantGame, candidate) && 
                  isAPIResultRelevantToQuestion(relevantGame, question, candidate)) {
                // console.log(`[Game Title] Found match in RAWG (extracted from bundle): "${candidate}" -> "${relevantGame}"`);
                return normalizeGameTitle(relevantGame);
              }
            }
            // Fallback to base game extraction if relevance check fails
            const baseGame = extractBaseGameFromBundle(rawgMatch);
            if (baseGame !== rawgMatch && isValidGameTitleCandidate(baseGame)) {
              // Try to find the base game in a follow-up search
              const baseGameMatch = await searchGameInRAWG(baseGame);
              if (baseGameMatch && !isBundleOrDLC(baseGameMatch) && 
                  isValidAPIResult(baseGameMatch, baseGame) &&
                  isAPIResultRelevantToQuestion(baseGameMatch, question, baseGame)) {
                // console.log(`[Game Title] Found base game in RAWG: "${candidate}" -> "${baseGameMatch}"`);
                return normalizeGameTitle(baseGameMatch);
              }
              // If no base game found, use cleaned version (validate it first)
              if (isValidAPIResult(baseGame, candidate) && 
                  isAPIResultRelevantToQuestion(baseGame, question, candidate)) {
                // console.log(`[Game Title] Found match in RAWG (cleaned from bundle): "${candidate}" -> "${baseGame}"`);
                return normalizeGameTitle(baseGame);
              }
            }
          }
          // console.log(`[Game Title] Found match in RAWG: "${candidate}" -> "${rawgMatch}"`);
          // Normalize the title (e.g., ensure "The Legend of Zelda" has "The")
          return normalizeGameTitle(rawgMatch);
        }
      } catch (error) {
        // Only log errors, not failures
        // console.log(`[Game Title] RAWG search failed for "${candidate}":`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // If no API matches, try to find the best candidate
    // Filter out candidates that look like they contain question text, not game titles
    const fallbackCandidates = candidates.filter(c => {
      const lower = c.toLowerCase();
      // Reject candidates that contain common question phrases
      if (lower.includes('has the') || 
          lower.includes('has highest') ||
          lower.includes('has best') ||
          lower.includes('kart has') ||
          lower.includes('is the') ||
          lower.includes('CTGP') ||
          lower.includes('has the lowest') ||
          lower.includes('has the worst') ||
          lower.includes('has the slowest') ||
          lower.includes('has the easiest') ||
          lower.includes('has the hardest') ||
          lower.match(/\b(has|have|is|are|does|do)\s+(the|a|an)\s+/)) {
        return false;
      }
      // Prefer candidates that are reasonable length (3-40 chars) and start with capital or special char
      return c.length >= 3 && c.length <= 40 && /^[A-ZÀ-ÿĀ-ž]/.test(c);
    });
    
    // If we have valid candidates, return the shortest one (likely to be the actual game title)
    if (fallbackCandidates.length > 0) {
      const bestCandidate = fallbackCandidates.sort((a, b) => a.length - b.length)[0];
      // console.log(`[Game Title] No API match for any candidate, using best fallback: "${bestCandidate}"`);
      return bestCandidate;
    }
    
    // Last resort: return first candidate that meets basic criteria
    const fallbackCandidate = candidates.find(c => 
      c.length >= 5 && 
      c.split(/\s+/).length >= 2 && 
      /^[A-ZÀ-ÿĀ-ž]/.test(c)
    );
    
    if (fallbackCandidate) {
      // console.log(`[Game Title] Using fallback candidate: "${fallbackCandidate}"`);
      return fallbackCandidate;
    }

    // console.log('[Game Title] No valid game title found after trying all candidates');
    return undefined;
  } catch (error) {
    console.error('[Game Title] Error in extractGameTitleFromQuestion:', error);
    return undefined;
  }
}

// ============================================================================
// OpenAI Chat Completion
// ============================================================================

/**
 * Get chat completion for user questions (text-only)
 */
export const getChatCompletion = async (question: string, systemMessage?: string): Promise<string | null> => {
  try {
    // Generate a cache key based on the question and system message
    const cacheKey = `chat:${question}:${systemMessage || 'default'}`;
    
    // Check if we have a cached response
    const cachedResponse = aiCache.get<string>(cacheKey);
    if (cachedResponse) {
      // Process cached response to shorten URLs (in case cache was created before URL shortening was added)
      return shortenMarkdownLinks(cachedResponse);
    }

    // Determine if this is a factual metadata question (can use IGDB/RAWG) or needs OpenAI
    const lowerQuestion = question.toLowerCase();
    
    // Factual metadata questions that IGDB/RAWG can answer
    const isMetadataQuestion = /when (was|is|did)|release date|released|came out|what (platform|system|console|developer|publisher|studio|company|year|genre|genres|rating|score|metacritic)|who (developed|published|made|created)|which (platform|system|console|genre)|is.*available (on|for)|can.*play (on|for)/i.test(lowerQuestion);
    
    // Check for specific gameplay questions
    const isSpecificQuestion = /(what|which|how|where|who|list|name|are|is).*(brand|brands|item|items|weapon|weapons|armor|equipment|character|characters|strategy|strategies|tip|tips|unlock|unlocks|obtain|get|find|catch|defeat|beat|complete|solve|build|class|classes|skill|skills|ability|abilities|mechanic|mechanics|feature|features|difference|differences|compare|comparison|version|versions|edition|editions|best|fastest|strongest|weakest|available|different|types|kinds|ways|methods|approaches|location|locations|boss|bosses|enemy|enemies|quest|quests|mission|missions)/i.test(lowerQuestion);
    
    let response: string | null = null;
    
    // For factual metadata questions, try IGDB/RAWG first
    if (isMetadataQuestion && !isSpecificQuestion) {
      const extractedGameTitle = await extractGameTitleFromQuestion(question);
      const searchQuery = extractedGameTitle || question;
      
      const limitedQuery = searchQuery.length > 255 
        ? (extractedGameTitle || searchQuery.substring(0, 252) + '...')
        : searchQuery;
      
      // Try IGDB first
      response = await fetchFromIGDB(limitedQuery);
      
      // Try RAWG if IGDB failed
      if (!response) {
        const rawgResponse = await fetchFromRAWG(limitedQuery);
        if (rawgResponse && !rawgResponse.includes("Failed") && !rawgResponse.includes("No games found")) {
          response = rawgResponse;
        }
      }
    }
    
    // For specific gameplay questions, or if IGDB/RAWG didn't return data, use OpenAI
    if (!response || isSpecificQuestion) {
      // Enhanced system message
      const enhancedSystemMessage = systemMessage || `You are Video Game Wingman, an expert AI assistant specializing in video games. 

CRITICAL INSTRUCTIONS:
- ALWAYS identify and use the EXACT game title from the question
- If the question specifies a game title, you MUST answer about THAT exact game, nothing else
- If the question mentions "Remake", "Remaster", or a specific sequel number, answer about THAT specific version ONLY
- Be specific and factual - cite specific features, mechanics, or details when possible
- If you don't have specific information about the exact game asked about, clearly state that rather than providing information about a different game`;
      
      // Select model based on game release date
      const extractedGameTitle = await extractGameTitleFromQuestion(question);
      const modelSelection = await selectModelForQuestion(extractedGameTitle, question);
      
      console.log(`[Model Selection] Using ${modelSelection.model} for "${extractedGameTitle || 'unknown game'}" (reason: ${modelSelection.reason}${modelSelection.releaseYear ? `, released: ${modelSelection.releaseYear}` : ''})`);
      
      // Build enhanced question with game context if available
      let enhancedQuestion = question;
      if (extractedGameTitle) {
        const gameContext = await fetchFromIGDB(extractedGameTitle) || await fetchFromRAWG(extractedGameTitle);
        if (gameContext) {
          enhancedQuestion = `Question: ${question}\n\nGame: ${extractedGameTitle}\nGame Context: ${gameContext}\n\nPlease provide a detailed, accurate answer to the question about ${extractedGameTitle}.`;
        }
      }
      
      const completion = await getOpenAIClient().chat.completions.create({
        model: modelSelection.model,
        messages: [
          { 
            role: 'system', 
            content: enhancedSystemMessage
          },
          { role: 'user', content: enhancedQuestion }
        ],
        max_tokens: 800,
      });

      response = completion.choices[0].message.content;
    }

    // Process response to shorten URLs in markdown links
    if (response) {
      response = shortenMarkdownLinks(response);
      
      // Cache the processed response
      aiCache.set(cacheKey, response);
    }

    return response;
  } catch (error: any) {
    console.error('Error in getChatCompletion:', error);
    
    // Provide user-friendly error messages
    if (error?.message?.includes('rate limit') || error?.message?.includes('Rate limit')) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    
    return null;
  }
};

/**
 * Get chat completion with vision support (for future image support)
 */
export const getChatCompletionWithVision = async (
  question: string,
  imageUrl?: string,
  imageBase64?: string,
  systemMessage?: string
): Promise<string | null> => {
  try {
    const messages: any[] = [
      {
        role: 'system',
        content: systemMessage || 'You are an expert video game assistant specializing in identifying games, levels, stages, items, and locations from screenshots. Analyze images carefully and provide detailed, accurate information.'
      },
      {
        role: 'user',
        content: []
      }
    ];

    // Add image if provided
    if (imageUrl || imageBase64) {
      const imageContent: any = {
        type: 'image_url',
        image_url: {}
      };

      if (imageUrl) {
        imageContent.image_url.url = imageUrl;
      } else if (imageBase64) {
        imageContent.image_url.url = imageBase64.startsWith('data:') 
          ? imageBase64 
          : `data:image/jpeg;base64,${imageBase64}`;
      }

      messages[1].content.push(imageContent);
    }

    // Add text question
    messages[1].content.push({
      type: 'text',
      text: question
    });

    // For vision requests, use gpt-4o (supports images)
    const VISION_MODEL = 'gpt-4o';
    
    // Select model based on game release date (extract from question if possible)
    const modelSelection = await selectModelForQuestion(undefined, question);
    
    // Override to vision-capable model
    let visionModel = VISION_MODEL;
    if (modelSelection.model === 'gpt-5.2') {
      // GPT-5.2 also supports vision, use it if selected
      visionModel = 'gpt-5.2';
    }
    
    console.log(`[Model Selection] Using ${visionModel} for vision request`);

    const completionParams: any = {
      model: visionModel,
      messages: messages as any,
      max_tokens: 1000,
      temperature: 0.7,
    };

    try {
      const completion = await getOpenAIClient().chat.completions.create(completionParams);
      const response = completion.choices[0].message.content;
      // Process response to shorten URLs in markdown links
      return response ? shortenMarkdownLinks(response) : null;
    } catch (apiError: any) {
      // Handle rate limit errors specifically
      if (apiError?.status === 429 && apiError?.error?.type === 'input-images') {
        console.error('[Vision API] Rate limit error for image inputs');
        throw new Error('Rate limit exceeded for image processing. Please try again in a moment.');
      }
      throw apiError;
    }
  } catch (error: any) {
    console.error('Error in getChatCompletionWithVision:', error);
    
    if (error?.message?.includes('rate limit') || error?.message?.includes('Rate limit')) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    } else if (error?.message?.includes('does not support image')) {
      throw error;
    } else {
      throw new Error('Failed to process image. Please try again or contact support if this persists.');
    }
  }
};

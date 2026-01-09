import axios from 'axios';

// Cache for client credentials access token
let cachedAccessToken: string | null = null;
let tokenExpiryTime: number | null = null;

/**
 * Retrieves a client credentials access token for Twitch API access (IGDB)
 * Implements caching to avoid unnecessary token requests
 * @returns Promise containing the access token string
 * @throws Error if environment variables are missing or token fetch fails
 */
export const getClientCredentialsAccessToken = async (): Promise<string> => {
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const tokenUrl = process.env.TWITCH_TOKEN_URL || 'https://id.twitch.tv/oauth2/token';

  if (!clientId || !clientSecret) {
    throw new Error('Missing Twitch environment variables: NEXT_PUBLIC_TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are required');
  }

  // Return cached token if still valid
  if (cachedAccessToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
    return cachedAccessToken;
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');

    const response = await axios.post(tokenUrl, params);

    // Cache the token with expiry time
    cachedAccessToken = response.data.access_token;
    // Subtract 60 seconds from expiry time as a safety buffer
    tokenExpiryTime = Date.now() + (response.data.expires_in - 60) * 1000;

    return cachedAccessToken || '';
  } catch (error: any) {
    console.error('Error fetching Twitch client credentials access token:', error.response?.data || error.message);
    throw new Error('Failed to fetch Twitch client credentials access token');
  }
};

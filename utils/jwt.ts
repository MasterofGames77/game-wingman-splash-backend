import jwt from 'jsonwebtoken';

/**
 * Generates a temporary authentication token for cross-domain authentication
 * This token is used when users navigate from splash page to main app
 * Token expires in 10 minutes and includes user information
 */
export const generateCrossDomainAuthToken = (
  userId: string,
  email: string,
  isApproved: boolean,
  hasProAccess: boolean
): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const payload = {
    userId,
    email,
    isApproved,
    hasProAccess,
    source: 'splash-page', // Indicates this token came from splash page
    type: 'cross-domain-auth' // Token type for validation
  };

  // Token expires in 10 minutes - short-lived for security
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10m' });
};

/**
 * Verifies a cross-domain authentication token
 * Returns the decoded token payload if valid
 */
export const verifyCrossDomainAuthToken = (token: string): {
  userId: string;
  email: string;
  isApproved: boolean;
  hasProAccess: boolean;
  source: string;
  type: string;
} => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

  // Validate token type
  if (decoded.type !== 'cross-domain-auth' || decoded.source !== 'splash-page') {
    throw new Error('Invalid token type');
  }

  return {
    userId: decoded.userId,
    email: decoded.email,
    isApproved: decoded.isApproved,
    hasProAccess: decoded.hasProAccess,
    source: decoded.source,
    type: decoded.type
  };
};

/**
 * Generates a standard access token (for future use if needed)
 */
export const generateAccessToken = (userId: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '10m' });
};

/**
 * Generates a refresh token (for future use if needed)
 */
export const generateRefreshToken = (userId: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Verifies a JWT token (generic)
 */
export const verifyToken = (token: string): any => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.verify(token, process.env.JWT_SECRET);
};

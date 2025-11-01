import { randomBytes } from 'crypto';

/**
 * Generates a unique userId with collision resistance.
 * Format: user-{timestamp}-{randomSuffix}
 * 
 * The timestamp provides ordering and uniqueness across time,
 * while the random suffix ensures uniqueness even when multiple
 * users sign up at the exact same millisecond.
 * 
 * @returns A unique userId string
 */
export function generateUserId(): string {
  // Get current timestamp
  const timestamp = Date.now();
  
  // Generate a random suffix (3 bytes = 6 hex characters) for collision resistance
  // This ensures uniqueness even if multiple signups happen in the same millisecond
  const randomSuffix = randomBytes(3).toString('hex');
  
  return `user-${timestamp}-${randomSuffix}`;
}

/**
 * Pro access deadline: December 31, 2025 at 23:59:59.999 UTC
 * Users who sign up on or before this date AND are in the first 5,000 positions
 * will receive 1 year of Wingman Pro for free.
 */
const PRO_DEADLINE = new Date('2025-12-31T23:59:59.999Z').getTime();

/**
 * Checks if a user is eligible for pro access based on their signup timestamp and position.
 * 
 * @param userId - The user's ID in format: user-{timestamp}-{randomSuffix}
 * @param position - The user's waitlist position (null if not on waitlist)
 * @returns true if the user is eligible for pro access, false otherwise
 */
export function checkProAccessEligibility(userId: string, position: number | null): boolean {
  // Extract timestamp from userId
  // Format: user-{timestamp}-{randomSuffix} (new) or user-{timestamp} (old)
  const timestampStr = userId.split('-')[1];
  if (!timestampStr) {
    // If we can't parse the timestamp, default to no pro access
    return false;
  }
  
  const signupTimestamp = parseInt(timestampStr, 10);
  if (isNaN(signupTimestamp)) {
    // If timestamp is invalid, default to no pro access
    return false;
  }
  
  // User must meet BOTH conditions:
  // 1. Signed up on or before the deadline (12/31/2025 23:59:59.999 UTC)
  // 2. Position is within the first 5,000
  // Note: If position is null (user already approved), we can't verify position eligibility,
  // so we return false unless we have a valid position number
  const signedUpBeforeDeadline = signupTimestamp <= PRO_DEADLINE;
  const inFirst5000 = typeof position === 'number' && position <= 5000;
  
  return signedUpBeforeDeadline && inFirst5000;
}

/**
 * Gets the pro access deadline timestamp for reference
 */
export function getProDeadline(): number {
  return PRO_DEADLINE;
}

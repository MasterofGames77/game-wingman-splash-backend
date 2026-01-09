import { Router, Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { isEmail } from 'validator';
import { sendEmail } from '../utils/sendEmail';
import { getSignupConfirmationEmail } from '../utils/emailTemplates';
import { generateCrossDomainAuthToken } from '../utils/jwt';
import { checkProAccessEligibility } from '../utils/checkProAccess';

const router = Router();

const isProduction = process.env.NODE_ENV === 'production';

// Base URL for any future email notifications
const BASE_URL = isProduction
  ? 'https://videogamewingman.com'
  : 'http://localhost:3000';

// Function to determine the correct ordinal suffix - moved outside route handler for better performance
function getOrdinalSuffix(position: number | null): string {
  if (position === null) return 'unknown';
  
  const remainder10 = position % 10;
  const remainder100 = position % 100;

  if (remainder10 === 1 && remainder100 !== 11) {
    return `${position}st`;
  } else if (remainder10 === 2 && remainder100 !== 12) {
    return `${position}nd`;
  } else if (remainder10 === 3 && remainder100 !== 13) {
    return `${position}rd`;
  } else {
    return `${position}th`;
  }
}

/**
 * Generates a link to the main assistant app with authentication token
 * This allows seamless authentication when navigating from splash page to main app
 */
function generateAssistantLink(
  userId: string,
  email: string,
  isApproved: boolean,
  hasProAccess: boolean
): string {
  try {
    // Generate temporary auth token (10 minute expiry)
    const authToken = generateCrossDomainAuthToken(userId, email, isApproved, hasProAccess);
    
    // Build URL with token and legacy params for backward compatibility
    const queryParams = new URLSearchParams({
      earlyAccess: 'true',
      userId: userId,
      email: email,
      token: authToken // Main app will use this to authenticate
    }).toString();

    return `https://assistant.videogamewingman.com?${queryParams}`;
  } catch (error) {
    // If JWT_SECRET is not set or token generation fails, fall back to legacy params
    console.warn('Failed to generate auth token, using legacy params:', error);
    const queryParams = new URLSearchParams({
      earlyAccess: 'true',
      userId: userId,
      email: email
    }).toString();
    return `https://assistant.videogamewingman.com?${queryParams}`;
  }
}

/**
 * GET /api/auth/verify
 * Simple verify endpoint for splash page frontend
 * Splash page is public, so this always returns "not authenticated"
 * This prevents 404 errors when frontend checks auth status
 */
router.get('/verify', (req: Request, res: Response) => {
  // Splash page is public - no authentication needed
  // Return not authenticated to prevent frontend errors
  return res.status(200).json({
    authenticated: false,
    message: 'Splash page is public - no authentication required'
  });
});

router.post('/signup', async (req, res) => {
  const email = String(req.body.email).toLowerCase().trim();

  // Input validation
  if (!email || !isEmail(email)) {
    return res.status(400).json({ message: 'Valid email is required' });
  }

  try {
    // Only fetch necessary fields using projection
    const existingUser = await User.findOne(
      { email },
      { isApproved: 1, position: 1, userId: 1, email: 1, hasProAccess: 1 }
    ).lean().exec() as unknown as Pick<IUser, 'isApproved' | 'position' | 'userId' | 'email' | 'hasProAccess'>;

    if (existingUser) {
      if (existingUser.isApproved) {
        // Generate link with authentication token for seamless cross-domain auth
        const assistantLink = generateAssistantLink(
          existingUser.userId,
          existingUser.email,
          true, // isApproved
          existingUser.hasProAccess
        );

        return res.status(200).json({
          message: 'You have already signed up and are approved.',
          link: assistantLink,
          userId: existingUser.userId,
          email: existingUser.email,
          isApproved: true,
          hasProAccess: existingUser.hasProAccess,
          emailSent: false // No email sent for existing users
        });
      }

      // If the user exists but is not approved
      const ordinalPosition = getOrdinalSuffix(existingUser.position);
      return res.status(200).json({
        message: `You have already signed up and are on the waitlist. You are currently ${ordinalPosition} on the waitlist.`,
        emailSent: false // No email sent for existing users
      });
    }

    // Optimize position calculation using countDocuments with no conditions
    const position = await User.countDocuments({}, { lean: true }) + 1;

    // Create user first to get userId (which contains signup timestamp)
    // We need the userId to check the deadline
    let newUser: IUser | null = null;
    let retries = 0;
    const MAX_RETRIES = 3;
    
    while (retries < MAX_RETRIES) {
      try {
        const user = new User({
          email,
          position,
          isApproved: false,
          hasProAccess: false // Will be set correctly after we have userId
        });

        await user.save();
        newUser = user;
        break; // Success, exit retry loop
      } catch (error: any) {
        // Check if it's a duplicate key error (MongoDB error code 11000)
        if (error.code === 11000 && error.keyPattern?.userId) {
          retries++;
          if (retries >= MAX_RETRIES) {
            throw new Error('Failed to generate unique userId after multiple attempts');
          }
          // Force regeneration of userId by creating a new User instance
          // The default function will be called again with a new timestamp/random
          continue;
        }
        // If it's not a userId duplicate error, rethrow
        throw error;
      }
    }

    // TypeScript guard: newUser should always be assigned if we reach here
    if (!newUser) {
      throw new Error('Failed to create user');
    }

    // Now check pro access eligibility based on signup timestamp and position
    // Deadline: July 31, 2026 11:59:59 PM EDT (August 1, 2026 03:59:59.999 UTC)
    // This ensures users who sign up after the deadline don't get pro access
    const hasProAccess = checkProAccessEligibility(newUser.userId, position);
    
    // Update hasProAccess if it changed
    if (newUser.hasProAccess !== hasProAccess) {
      newUser.hasProAccess = hasProAccess;
      await newUser.save();
    }
    
    const bonusMessage = hasProAccess 
      ? `\nYou are the ${getOrdinalSuffix(position)} of the first 5,000 users to sign up! You will receive 1 year of Wingman Pro for free!`
      : '';

    // Send signup confirmation email (non-blocking) - ONLY for new signups
    let emailSent = false;
    try {
      const emailContent = getSignupConfirmationEmail(
        newUser.email,
        position,
        hasProAccess
      );
      await sendEmail(
        newUser.email,
        emailContent.subject,
        emailContent.html,
        emailContent.text
      );
      emailSent = true; // Email was successfully sent
    } catch (emailError) {
      // Log error but don't fail the signup
      console.error('Failed to send signup confirmation email:', emailError);
      emailSent = false; // Email failed to send
    }

    return res.status(201).json({ 
      message: `Congratulations! You've been added to the waitlist.${bonusMessage}`, 
      position,
      userId: newUser.userId,
      email: newUser.email,
      isApproved: false,
      hasProAccess,
      emailSent // Email sent for new signups only (true if successful, false if failed)
    });

  } catch (error) {
    console.error('Error during signup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error adding email to the waitlist';
    res.status(500).json({ message: errorMessage });
  }
});

export default router;
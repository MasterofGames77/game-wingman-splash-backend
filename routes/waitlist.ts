import { Request, Response, Router } from 'express';
import User from '../models/User';
import { isEmail } from 'validator';
import { checkProAccessEligibility } from '../utils/checkProAccess';

const router = Router();

router.post('/waitlist', async (req: Request, res: Response) => {
  const email = String(req.body.email).toLowerCase().trim();

  // Input validation
  if (!email || !isEmail(email)) {
    return res.status(400).json({ message: 'Valid email is required' });
  }

  try {
    // Use lean() for better performance and only check existence
    const existingUser = await User.findOne(
      { email },
      { _id: 1 }
    ).lean();

    if (existingUser) {
      return res.status(400).json({ message: 'Email is already on the waitlist' });
    }

    // Optimize position calculation using countDocuments with no conditions
    const position = await User.countDocuments({}, { lean: true }) + 1;

    // Create user first to get userId (which contains signup timestamp)
    // We need the userId to check the deadline
    let newUser;
    let retries = 0;
    const MAX_RETRIES = 3;
    
    while (retries < MAX_RETRIES) {
      try {
        newUser = new User({
          email,
          position,
          isApproved: false,
          hasProAccess: false // Will be set correctly after we have userId
        });

        await newUser.save();
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

    // Now check pro access eligibility based on signup timestamp and position
    // This ensures users who sign up after 12/31/2025 don't get pro access
    const hasProAccess = checkProAccessEligibility(newUser.userId, position);
    
    // Update hasProAccess if it changed
    if (newUser.hasProAccess !== hasProAccess) {
      newUser.hasProAccess = hasProAccess;
      await newUser.save();
    }

    return res.status(201).json({ 
      message: 'Congratulations! You\'ve been added to the waitlist.', 
      position,
      hasProAccess
    });
  } catch (error) {
    console.error('Error adding email to waitlist:', error);
    const errorMessage = error instanceof Error ? error.message : 'Server error. Please try again later.';
    return res.status(500).json({ message: errorMessage });
  }
});

export default router;
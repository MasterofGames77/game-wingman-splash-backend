import { Request, Response, Router } from 'express';
import User from '../models/User';
import { isEmail } from 'validator';

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

    // Determine pro access status once
    const hasProAccess = position <= 5000;

    // Create and save new user with retry logic for duplicate key errors
    let newUser;
    let retries = 0;
    const MAX_RETRIES = 3;
    
    while (retries < MAX_RETRIES) {
      try {
        newUser = new User({
          email,
          position,
          isApproved: false,
          hasProAccess
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

    return res.status(201).json({ 
      message: 'Congratulations! You\'ve been added to the waitlist.', 
      position 
    });
  } catch (error) {
    console.error('Error adding email to waitlist:', error);
    const errorMessage = error instanceof Error ? error.message : 'Server error. Please try again later.';
    return res.status(500).json({ message: errorMessage });
  }
});

export default router;
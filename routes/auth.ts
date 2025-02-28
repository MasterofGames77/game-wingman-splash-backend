import { Router } from 'express';
import User, { IUser } from '../models/User';
import { isEmail } from 'validator';

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
      { isApproved: 1, position: 1, userId: 1, email: 1 }
    ).lean().exec() as unknown as Pick<IUser, 'isApproved' | 'position' | 'userId' | 'email'>;

    if (existingUser) {
      if (existingUser.isApproved) {
        const queryParams = new URLSearchParams({
          userId: existingUser.userId,
          email: existingUser.email
        }).toString();

        return res.status(200).json({
          message: 'You have already signed up and are approved.',
          link: `https://assistant.videogamewingman.com?${queryParams}`,
        });
      }

      // If the user exists but is not approved
      const ordinalPosition = getOrdinalSuffix(existingUser.position);
      return res.status(200).json({
        message: `You have already signed up and are on the waitlist. You are currently ${ordinalPosition} on the waitlist.`,
      });
    }

    // Optimize position calculation using countDocuments with no conditions
    const position = await User.countDocuments({}, { lean: true }) + 1;

    // Determine pro access status once
    const hasProAccess = position <= 5000;
    const bonusMessage = hasProAccess 
      ? `\nYou are the ${getOrdinalSuffix(position)} of the first 5,000 users to sign up! You will receive 1 year of Wingman Pro for free!`
      : '';

    // Create and save new user
    const newUser = new User({
      email,
      position,
      isApproved: false,
      hasProAccess
    });

    await newUser.save();

    return res.status(201).json({ 
      message: `Congratulations! You've been added to the waitlist.${bonusMessage}`, 
      position 
    });

  } catch (error) {
    console.error('Error during signup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error adding email to the waitlist';
    res.status(500).json({ message: errorMessage });
  }
});

export default router;
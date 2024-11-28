import { Router } from 'express';
import User from '../models/User';

const router = Router();

const isProduction = process.env.NODE_ENV === 'production';

// Base URL for any future email notifications
const BASE_URL = isProduction
  ? 'https://vgw-splash-page-frontend-71431835113b.herokuapp.com/'  // Update this with your production URL
  : 'http://localhost:3000';

router.post('/signup', async (req, res) => {
  console.log('Signup request received:', req.body);

  const { email } = req.body;

  try {
    // Check if the user already exists in the database
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // If the user exists and is approved
      if (existingUser.isApproved) {
        return res.status(200).json({
          message: 'You have already signed up and are approved.',
          link: 'https://video-game-wingman-57d61bef9e61.herokuapp.com/',
        });
      }

      // If the user exists but is not approved
      return res.status(200).json({
        message: `You have already signed up and are on the waitlist. Your current waitlist position is ${existingUser.position}.`,
      });
    }

    // Function to determine the correct ordinal suffix
  function getOrdinalSuffix(position: number): string {
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

    // If the user doesn't exist, add them to the waitlist
    const position = await User.countDocuments() + 1;

    let bonusMessage = '';
  if (position <= 5000) {
    const ordinalPosition = getOrdinalSuffix(position);
    bonusMessage = `\nYou are the ${ordinalPosition} of the first 5,000 users to sign up! You will receive 1 year of Wingman Pro for free!`;
  }

    const newUser = new User({
      email,
      position,
      isApproved: false,
      hasProAccess: position <= 5000
    });

    await newUser.save();
    console.log('New user saved to database');

    res.status(201).json({ message: `Congratulations! You've been added to the waitlist. ${bonusMessage}`, position });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ message: 'Error adding email to the waitlist' });
  }
});

export default router;
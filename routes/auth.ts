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

    // If the user doesn't exist, add them to the waitlist
    const position = await User.countDocuments() + 1;

    const newUser = new User({
      email,
      position,
      isApproved: false,
    });

    await newUser.save();
    console.log('New user saved to database');

    res.status(201).json({ message: 'Congratulations! You\'ve been added to the waitlist.' });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ message: 'Error adding email to the waitlist' });
  }
});

export default router;
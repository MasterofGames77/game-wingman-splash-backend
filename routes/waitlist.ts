import { Request, Response, Router } from 'express';
import User from '../models/User';

const router = Router();

router.post('/waitlist', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'Email is already on the waitlist' });
    }

    const position = await User.countDocuments() + 1;

    const newUser = new User({
      email,
      position,
      isApproved: false,
      hasProAccess: position <= 5000
    });

    await newUser.save();

    res.status(201).json({ message: 'Congratulations! You\'ve been added to the waitlist.', position });
  } catch (err) {
    console.error('Error adding email to waitlist:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

export default router;
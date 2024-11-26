import express, { Request, Response } from 'express';
import User from '../models/User';

const router = express.Router();

router.get('/getWaitlistPosition', async (req: Request, res: Response) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isApproved) {
      return res.status(200).json({ isApproved: true, message: 'You are approved!', link: 'https://video-game-wingman-57d61bef9e61.herokuapp.com/' });
    } else {
      return res.status(200).json({ position: user.position, isApproved: false, message: `You are on the waitlist. Your position is ${user.position}.` });
    }
  } catch (error) {
    console.error('Error retrieving waitlist position:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
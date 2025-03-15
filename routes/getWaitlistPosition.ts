import express, { Request, Response } from 'express';
import User from '../models/User';
import NodeCache from 'node-cache';
import { isEmail } from 'validator';

const router = express.Router();
// Cache approved users for 1 hour
const approvedUsersCache = new NodeCache({ stdTTL: 3600 });

router.get('/getWaitlistPosition', async (req: Request, res: Response) => {
  const email = String(req.query.email).toLowerCase().trim();

  // Input validation
  if (!email || !isEmail(email)) {
    return res.status(400).json({ message: 'Valid email is required' });
  }

  try {
    // Check cache first for approved users
    const cachedResponse = approvedUsersCache.get(email);
    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }

    // Only fetch isApproved and position fields
    const user = await User.findOne(
      { email },
      { isApproved: 1, position: 1 }
    ).lean().exec() as unknown as { isApproved: boolean; position: number | null };

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isApproved) {
      const response = {
        isApproved: true,
        message: 'You are approved!',
        link: 'https://assistant.videogamewingman.com'
      };
      // Cache the response for approved users
      approvedUsersCache.set(email, response);
      return res.status(200).json(response);
    }

    return res.status(200).json({
      position: user.position,
      isApproved: false,
      message: `You are on the waitlist. Your position is ${user.position}.`
    });

  } catch (error) {
    console.error('Error retrieving waitlist position:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    res.status(500).json({ message: errorMessage });
  }
});

export default router;
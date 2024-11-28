import { Router, Request, Response } from 'express';
import User from '../models/User';
import { syncUserToWingman } from '../utils/syncUserData';

const router = Router();

router.post('/approveUser', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store original position for pro access check
    const originalPosition = user.position;
    
    // Update splash page database
    user.position = null;
    user.isApproved = true;
    user.hasProAccess = typeof originalPosition === 'number' && originalPosition <= 5000;
    await user.save();

    // Sync to Wingman database
    await syncUserToWingman(user);

    // Recalculate positions for remaining waitlist users
    const users = await User.find({ position: { $ne: null } }).sort('position');
    for (let i = 0; i < users.length; i++) {
      users[i].position = i + 1;
      await users[i].save();
    }

    res.status(200).json({ 
      message: 'User approved and databases synced successfully',
      hasProAccess: user.hasProAccess
    });
  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
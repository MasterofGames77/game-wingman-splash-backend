import { Router, Request, Response } from 'express';
import User from '../models/User';

const router = Router();

router.post('/approveUser', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Approve the user and remove them from the waitlist
    user.position = null;
    user.isApproved = true;

    await user.save();

    // Recalculate positions for the remaining users on the waitlist
    const users = await User.find({ position: { $ne: null } }).sort('position');
    users.forEach(async (user, index) => {
      user.position = index + 1;
      await user.save();
    });

    res.status(200).json({ message: 'User approved and positions updated' });
  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
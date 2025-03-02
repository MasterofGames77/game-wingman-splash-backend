import { Router, Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { syncUserToWingman } from '../utils/syncUserData';
import { isValidObjectId } from 'mongoose';

const router = Router();

router.post('/approveUser', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    // Input validation
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Valid userId is required' });
    }

    // Use lean() for better performance and only fetch needed fields
    const user = await User.findById(userId).lean().exec() as unknown as IUser;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store original position for pro access check
    const originalPosition = user.position;
    const hasProAccess = typeof originalPosition === 'number' && originalPosition <= 5000;

    // Update user in a single operation
    await User.findByIdAndUpdate(userId, {
      $set: {
        position: null,
        isApproved: true,
        hasProAccess
      }
    }, { new: true });

    // Sync to Wingman database
    await syncUserToWingman(user);

    // Bulk update remaining waitlist users' positions
    const users = await User.find(
      { position: { $ne: null } },
      { position: 1 },
      { sort: { position: 1 } }
    ).lean();

    if (users.length > 0) {
      // Prepare bulk operations
      const bulkOps = users.map((user, index) => ({
        updateOne: {
          filter: { _id: user._id },
          update: { $set: { position: index + 1 } }
        }
      }));

      // Execute bulk update in a single operation
      await User.bulkWrite(bulkOps, { ordered: true });
    }

    return res.status(200).json({ 
      message: 'User approved and databases synced successfully',
      hasProAccess
    });
  } catch (error) {
    console.error('Error approving user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    return res.status(500).json({ message: errorMessage });
  }
});

export default router;
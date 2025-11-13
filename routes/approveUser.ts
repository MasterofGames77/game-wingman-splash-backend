import { Router, Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { syncUserToWingman } from '../utils/syncUserData';
import { isValidObjectId } from 'mongoose';
import { sendEmail } from '../utils/sendEmail';
import { getApprovalNotificationEmail } from '../utils/emailTemplates';

const router = Router();

router.post('/approveUser', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    // Input validation - accept either MongoDB ObjectId or custom userId string
    if (!userId) {
      return res.status(400).json({ message: 'Valid userId is required' });
    }

    // Try to find user by MongoDB ObjectId first, then by custom userId string
    let user: IUser | null = null;
    if (isValidObjectId(userId)) {
      user = await User.findById(userId).lean().exec() as unknown as IUser;
    }
    
    // If not found by ObjectId, try finding by custom userId string
    if (!user) {
      user = await User.findOne({ userId }).lean().exec() as unknown as IUser;
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store original position for pro access check
    const originalPosition = user.position;
    const hasProAccess = typeof originalPosition === 'number' && originalPosition <= 5000;

    // Update user in a single operation - use MongoDB _id for the update
    const updatedUser = await User.findByIdAndUpdate(user._id, {
      $set: {
        position: null,
        isApproved: true,
        hasProAccess
      }
    }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found for update' });
    }

    // Sync to Wingman database with updated user data
    try {
      await syncUserToWingman(updatedUser as IUser);
      console.log(`Successfully synced user ${updatedUser.email} (${updatedUser.userId}) to main application database`);
    } catch (syncError) {
      console.error(`Failed to sync user ${updatedUser.email} (${updatedUser.userId}) to main application:`, syncError);
      // Continue anyway - user is approved in splash page DB
      // But log the error so it can be investigated
    }

    // Send approval notification email (non-blocking)
    try {
      const emailContent = getApprovalNotificationEmail(
        updatedUser.email,
        updatedUser.userId,
        hasProAccess
      );
      await sendEmail(
        updatedUser.email,
        emailContent.subject,
        emailContent.html,
        emailContent.text
      );
    } catch (emailError) {
      // Log error but don't fail the approval
      console.error('Failed to send approval notification email:', emailError);
    }

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
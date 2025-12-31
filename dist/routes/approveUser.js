"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const syncUserData_1 = require("../utils/syncUserData");
const mongoose_1 = require("mongoose");
const sendEmail_1 = require("../utils/sendEmail");
const emailTemplates_1 = require("../utils/emailTemplates");
const checkProAccess_1 = require("../utils/checkProAccess");
const router = (0, express_1.Router)();
router.post('/approveUser', async (req, res) => {
    try {
        const { userId } = req.body;
        // Input validation - accept either MongoDB ObjectId or custom userId string
        if (!userId) {
            return res.status(400).json({ message: 'Valid userId is required' });
        }
        // Try to find user by MongoDB ObjectId first, then by custom userId string
        let user = null;
        if ((0, mongoose_1.isValidObjectId)(userId)) {
            user = await User_1.default.findById(userId).lean().exec();
        }
        // If not found by ObjectId, try finding by custom userId string
        if (!user) {
            user = await User_1.default.findOne({ userId }).lean().exec();
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Store original position for pro access check
        const originalPosition = user.position;
        // Check pro access eligibility based on signup timestamp and position
        // This ensures users who signed up after 12/31/2025 don't get pro access
        const hasProAccess = (0, checkProAccess_1.checkProAccessEligibility)(user.userId, originalPosition);
        // Update user in a single operation - use MongoDB _id for the update
        const updatedUser = await User_1.default.findByIdAndUpdate(user._id, {
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
            await (0, syncUserData_1.syncUserToWingman)(updatedUser);
            console.log(`Successfully synced user ${updatedUser.email} (${updatedUser.userId}) to main application database`);
        }
        catch (syncError) {
            console.error(`Failed to sync user ${updatedUser.email} (${updatedUser.userId}) to main application:`, syncError);
            // Continue anyway - user is approved in splash page DB
            // But log the error so it can be investigated
        }
        // Send approval notification email (non-blocking)
        try {
            const emailContent = (0, emailTemplates_1.getApprovalNotificationEmail)(updatedUser.email, updatedUser.userId, hasProAccess);
            await (0, sendEmail_1.sendEmail)(updatedUser.email, emailContent.subject, emailContent.html, emailContent.text);
        }
        catch (emailError) {
            // Log error but don't fail the approval
            console.error('Failed to send approval notification email:', emailError);
        }
        // Bulk update remaining waitlist users' positions
        const users = await User_1.default.find({ position: { $ne: null } }, { position: 1 }, { sort: { position: 1 } }).lean();
        if (users.length > 0) {
            // Prepare bulk operations
            const bulkOps = users.map((user, index) => ({
                updateOne: {
                    filter: { _id: user._id },
                    update: { $set: { position: index + 1 } }
                }
            }));
            // Execute bulk update in a single operation
            await User_1.default.bulkWrite(bulkOps, { ordered: true });
        }
        return res.status(200).json({
            message: 'User approved and databases synced successfully',
            hasProAccess
        });
    }
    catch (error) {
        console.error('Error approving user:', error);
        const errorMessage = error instanceof Error ? error.message : 'Server error';
        return res.status(500).json({ message: errorMessage });
    }
});
exports.default = router;

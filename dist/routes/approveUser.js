"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const syncUserData_1 = require("../utils/syncUserData");
const mongoose_1 = require("mongoose");
const router = (0, express_1.Router)();
router.post('/approveUser', async (req, res) => {
    try {
        const { userId } = req.body;
        // Input validation
        if (!userId || !(0, mongoose_1.isValidObjectId)(userId)) {
            return res.status(400).json({ message: 'Valid userId is required' });
        }
        // Use lean() for better performance and only fetch needed fields
        const user = await User_1.default.findById(userId).lean().exec();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Store original position for pro access check
        const originalPosition = user.position;
        const hasProAccess = typeof originalPosition === 'number' && originalPosition <= 5000;
        // Update user in a single operation
        await User_1.default.findByIdAndUpdate(userId, {
            $set: {
                position: null,
                isApproved: true,
                hasProAccess
            }
        }, { new: true });
        // Sync to Wingman database
        await (0, syncUserData_1.syncUserToWingman)(user);
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

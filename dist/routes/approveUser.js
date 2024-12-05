"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const syncUserData_1 = require("../utils/syncUserData");
const router = (0, express_1.Router)();
router.post('/approveUser', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User_1.default.findById(userId);
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
        await (0, syncUserData_1.syncUserToWingman)(user);
        // Recalculate positions for remaining waitlist users
        const users = await User_1.default.find({ position: { $ne: null } }).sort('position');
        for (let i = 0; i < users.length; i++) {
            users[i].position = i + 1;
            await users[i].save();
        }
        res.status(200).json({
            message: 'User approved and databases synced successfully',
            hasProAccess: user.hasProAccess
        });
    }
    catch (err) {
        console.error('Error approving user:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;

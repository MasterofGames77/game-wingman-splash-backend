"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
router.post('/approveUser', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Approve the user and remove them from the waitlist
        user.position = null;
        user.isApproved = true;
        await user.save();
        // Recalculate positions for the remaining users on the waitlist
        const users = await User_1.default.find({ position: { $ne: null } }).sort('position');
        users.forEach(async (user, index) => {
            user.position = index + 1;
            await user.save();
        });
        res.status(200).json({ message: 'User approved and positions updated' });
    }
    catch (err) {
        console.error('Error approving user:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;

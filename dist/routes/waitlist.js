"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
router.post('/waitlist', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already on the waitlist' });
        }
        const position = await User_1.default.countDocuments() + 1;
        const newUser = new User_1.default({
            email,
            position,
            isApproved: false,
        });
        await newUser.save();
        res.status(201).json({ message: 'Congratulations! You\'ve been added to the waitlist.', position });
    }
    catch (err) {
        console.error('Error adding email to waitlist:', err);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const validator_1 = require("validator");
const router = (0, express_1.Router)();
router.post('/waitlist', async (req, res) => {
    const email = String(req.body.email).toLowerCase().trim();
    // Input validation
    if (!email || !(0, validator_1.isEmail)(email)) {
        return res.status(400).json({ message: 'Valid email is required' });
    }
    try {
        // Use lean() for better performance and only check existence
        const existingUser = await User_1.default.findOne({ email }, { _id: 1 }).lean();
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already on the waitlist' });
        }
        // Optimize position calculation using countDocuments with no conditions
        const position = await User_1.default.countDocuments({}, { lean: true }) + 1;
        // Determine pro access status once
        const hasProAccess = position <= 5000;
        // Create and save new user
        const newUser = new User_1.default({
            email,
            position,
            isApproved: false,
            hasProAccess
        });
        await newUser.save();
        return res.status(201).json({
            message: 'Congratulations! You\'ve been added to the waitlist.',
            position
        });
    }
    catch (error) {
        console.error('Error adding email to waitlist:', error);
        const errorMessage = error instanceof Error ? error.message : 'Server error. Please try again later.';
        return res.status(500).json({ message: errorMessage });
    }
});
exports.default = router;

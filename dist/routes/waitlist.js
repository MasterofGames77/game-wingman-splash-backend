"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User")); // Import the User model
const router = (0, express_1.Router)();
router.post('/waitlist', async (req, res) => {
    // Access the user from the middleware
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const existingUser = await User_1.default.findOne({ email: user.email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already on the waitlist' });
        }
        const position = await User_1.default.countDocuments() + 1;
        // Create a new user with the correct schema properties
        const newUser = new User_1.default({
            email: user.email,
            password: user.password, // Assuming the password is hashed at this point
            position,
            isApproved: false,
        });
        await newUser.save();
        res.status(200).json({ message: 'Email added to the waitlist', position });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});
exports.default = router;

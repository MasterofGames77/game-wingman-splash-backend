"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
const isProduction = process.env.NODE_ENV === 'production';
// Base URL for any future email notifications
const BASE_URL = isProduction
    ? 'https://vgw-splash-page-frontend-71431835113b.herokuapp.com/' // Update this with your production URL
    : 'http://localhost:3000';
router.post('/signup', async (req, res) => {
    console.log('Signup request received:', req.body);
    const { email } = req.body;
    try {
        // Check if the user already exists in the database
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            // If the user exists and is approved
            if (existingUser.isApproved) {
                return res.status(200).json({
                    message: 'You have already signed up and are approved.',
                    link: 'https://video-game-wingman-57d61bef9e61.herokuapp.com/',
                });
            }
            // If the user exists but is not approved
            return res.status(200).json({
                message: `You have already signed up and are on the waitlist. Your current waitlist position is ${existingUser.position}.`,
            });
        }
        // If the user doesn't exist, add them to the waitlist
        const position = await User_1.default.countDocuments() + 1;
        const newUser = new User_1.default({
            email,
            position,
            isApproved: false,
        });
        await newUser.save();
        console.log('New user saved to database');
        res.status(201).json({ message: 'Congratulations! You\'ve been added to the waitlist.' });
    }
    catch (err) {
        console.error('Error during signup:', err);
        res.status(500).json({ message: 'Error adding email to the waitlist' });
    }
});
exports.default = router;

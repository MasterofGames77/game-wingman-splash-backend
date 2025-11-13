"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const validator_1 = require("validator");
const sendEmail_1 = require("../utils/sendEmail");
const emailTemplates_1 = require("../utils/emailTemplates");
const router = (0, express_1.Router)();
const isProduction = process.env.NODE_ENV === 'production';
// Base URL for any future email notifications
const BASE_URL = isProduction
    ? 'https://videogamewingman.com'
    : 'http://localhost:3000';
// Function to determine the correct ordinal suffix - moved outside route handler for better performance
function getOrdinalSuffix(position) {
    if (position === null)
        return 'unknown';
    const remainder10 = position % 10;
    const remainder100 = position % 100;
    if (remainder10 === 1 && remainder100 !== 11) {
        return `${position}st`;
    }
    else if (remainder10 === 2 && remainder100 !== 12) {
        return `${position}nd`;
    }
    else if (remainder10 === 3 && remainder100 !== 13) {
        return `${position}rd`;
    }
    else {
        return `${position}th`;
    }
}
router.post('/signup', async (req, res) => {
    const email = String(req.body.email).toLowerCase().trim();
    // Input validation
    if (!email || !(0, validator_1.isEmail)(email)) {
        return res.status(400).json({ message: 'Valid email is required' });
    }
    try {
        // Only fetch necessary fields using projection
        const existingUser = await User_1.default.findOne({ email }, { isApproved: 1, position: 1, userId: 1, email: 1, hasProAccess: 1 }).lean().exec();
        if (existingUser) {
            if (existingUser.isApproved) {
                const queryParams = new URLSearchParams({
                    earlyAccess: 'true',
                    userId: existingUser.userId,
                    email: existingUser.email
                }).toString();
                return res.status(200).json({
                    message: 'You have already signed up and are approved.',
                    link: `https://assistant.videogamewingman.com?${queryParams}`,
                    userId: existingUser.userId,
                    email: existingUser.email,
                    isApproved: true,
                    hasProAccess: existingUser.hasProAccess,
                    emailSent: false // No email sent for existing users
                });
            }
            // If the user exists but is not approved
            const ordinalPosition = getOrdinalSuffix(existingUser.position);
            return res.status(200).json({
                message: `You have already signed up and are on the waitlist. You are currently ${ordinalPosition} on the waitlist.`,
                emailSent: false // No email sent for existing users
            });
        }
        // Optimize position calculation using countDocuments with no conditions
        const position = await User_1.default.countDocuments({}, { lean: true }) + 1;
        // Determine pro access status once
        const hasProAccess = position <= 5000;
        const bonusMessage = hasProAccess
            ? `\nYou are the ${getOrdinalSuffix(position)} of the first 5,000 users to sign up! You will receive 1 year of Wingman Pro for free!`
            : '';
        // Create and save new user with retry logic for duplicate key errors
        let newUser = null;
        let retries = 0;
        const MAX_RETRIES = 3;
        while (retries < MAX_RETRIES) {
            try {
                const user = new User_1.default({
                    email,
                    position,
                    isApproved: false,
                    hasProAccess
                });
                await user.save();
                newUser = user;
                break; // Success, exit retry loop
            }
            catch (error) {
                // Check if it's a duplicate key error (MongoDB error code 11000)
                if (error.code === 11000 && error.keyPattern?.userId) {
                    retries++;
                    if (retries >= MAX_RETRIES) {
                        throw new Error('Failed to generate unique userId after multiple attempts');
                    }
                    // Force regeneration of userId by creating a new User instance
                    // The default function will be called again with a new timestamp/random
                    continue;
                }
                // If it's not a userId duplicate error, rethrow
                throw error;
            }
        }
        // TypeScript guard: newUser should always be assigned if we reach here
        if (!newUser) {
            throw new Error('Failed to create user');
        }
        // Send signup confirmation email (non-blocking) - ONLY for new signups
        let emailSent = false;
        try {
            const emailContent = (0, emailTemplates_1.getSignupConfirmationEmail)(newUser.email, position, hasProAccess);
            await (0, sendEmail_1.sendEmail)(newUser.email, emailContent.subject, emailContent.html, emailContent.text);
            emailSent = true; // Email was successfully sent
        }
        catch (emailError) {
            // Log error but don't fail the signup
            console.error('Failed to send signup confirmation email:', emailError);
            emailSent = false; // Email failed to send
        }
        return res.status(201).json({
            message: `Congratulations! You've been added to the waitlist.${bonusMessage}`,
            position,
            userId: newUser.userId,
            email: newUser.email,
            isApproved: false,
            hasProAccess,
            emailSent // Email sent for new signups only (true if successful, false if failed)
        });
    }
    catch (error) {
        console.error('Error during signup:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error adding email to the waitlist';
        res.status(500).json({ message: errorMessage });
    }
});
exports.default = router;

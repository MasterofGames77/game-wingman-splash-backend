"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const node_cache_1 = __importDefault(require("node-cache"));
const validator_1 = require("validator");
const jwt_1 = require("../utils/jwt");
const router = express_1.default.Router();
// Cache approved users for 1 hour
const approvedUsersCache = new node_cache_1.default({ stdTTL: 3600 });
/**
 * Generates a link to the main assistant app with authentication token
 * This allows seamless authentication when navigating from splash page to main app
 */
function generateAssistantLink(userId, email, isApproved, hasProAccess) {
    try {
        // Generate temporary auth token (10 minute expiry)
        const authToken = (0, jwt_1.generateCrossDomainAuthToken)(userId, email, isApproved, hasProAccess);
        // Build URL with token and legacy params for backward compatibility
        const queryParams = new URLSearchParams({
            earlyAccess: 'true',
            userId: userId,
            email: email,
            token: authToken // Main app will use this to authenticate
        }).toString();
        return `https://assistant.videogamewingman.com?${queryParams}`;
    }
    catch (error) {
        // If JWT_SECRET is not set or token generation fails, fall back to legacy params
        console.warn('Failed to generate auth token, using legacy params:', error);
        const queryParams = new URLSearchParams({
            earlyAccess: 'true',
            userId: userId,
            email: email
        }).toString();
        return `https://assistant.videogamewingman.com?${queryParams}`;
    }
}
router.get('/getWaitlistPosition', async (req, res) => {
    const email = String(req.query.email).toLowerCase().trim();
    // Input validation
    if (!email || !(0, validator_1.isEmail)(email)) {
        return res.status(400).json({ message: 'Valid email is required' });
    }
    try {
        // Check cache first for approved users
        const cachedResponse = approvedUsersCache.get(email);
        if (cachedResponse) {
            return res.status(200).json(cachedResponse);
        }
        // Only fetch isApproved, position, userId, and hasProAccess fields
        const user = await User_1.default.findOne({ email }, { isApproved: 1, position: 1, userId: 1, hasProAccess: 1 }).lean().exec();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.isApproved) {
            // Generate link with authentication token for seamless cross-domain auth
            const assistantLink = generateAssistantLink(user.userId, email, true, // isApproved
            user.hasProAccess);
            const response = {
                isApproved: true,
                message: 'You are approved!',
                link: assistantLink,
                userId: user.userId,
                email: email,
                hasProAccess: user.hasProAccess
            };
            // Cache the response for approved users
            approvedUsersCache.set(email, response);
            return res.status(200).json(response);
        }
        return res.status(200).json({
            position: user.position,
            isApproved: false,
            message: `You are on the waitlist. Your position is ${user.position}.`
        });
    }
    catch (error) {
        console.error('Error retrieving waitlist position:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        res.status(500).json({ message: errorMessage });
    }
});
exports.default = router;

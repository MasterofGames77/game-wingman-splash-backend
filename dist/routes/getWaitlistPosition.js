"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const node_cache_1 = __importDefault(require("node-cache"));
const validator_1 = require("validator");
const router = express_1.default.Router();
// Cache approved users for 1 hour
const approvedUsersCache = new node_cache_1.default({ stdTTL: 3600 });
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
        // Only fetch isApproved and position fields
        const user = await User_1.default.findOne({ email }, { isApproved: 1, position: 1 }).lean().exec();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.isApproved) {
            const response = {
                isApproved: true,
                message: 'You are approved!',
                link: 'https://assistant.videogamewingman.com?earlyAccess=true'
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

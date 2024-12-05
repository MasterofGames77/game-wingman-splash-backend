"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
router.get('/getWaitlistPosition', async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.isApproved) {
            return res.status(200).json({ isApproved: true, message: 'You are approved!', link: 'https://video-game-wingman-57d61bef9e61.herokuapp.com/' });
        }
        else {
            return res.status(200).json({ position: user.position, isApproved: false, message: `You are on the waitlist. Your position is ${user.position}.` });
        }
    }
    catch (error) {
        console.error('Error retrieving waitlist position:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
exports.default = router;

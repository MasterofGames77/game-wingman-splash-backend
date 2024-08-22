"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt"); // Import the verifyToken function
const User_1 = __importDefault(require("../models/User"));
const authMiddleware = async (req, res, next) => {
    let token = req.headers.authorization;
    // Log the incoming token
    console.log('Received Token:', token);
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    // Strip 'Bearer ' prefix if it exists
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length).trim();
    }
    try {
        const decoded = (0, jwt_1.verifyToken)(token); // Use the imported verifyToken function
        // Log the decoded token
        console.log('Decoded Token:', decoded);
        const user = await User_1.default.findById(decoded.userId);
        console.log('Looking for User with ID:', decoded.userId);
        if (!user) {
            console.log('No user found with the provided ID');
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Attach the user to the request object using a plain property
        req.user = user;
        // Log the user that was found
        console.log('Authenticated User:', user);
        next();
    }
    catch (err) {
        console.error('Error verifying token or finding user:', err);
        return res.status(401).json({ message: 'Unauthorized' });
    }
};
exports.authMiddleware = authMiddleware;
exports.default = exports.authMiddleware;

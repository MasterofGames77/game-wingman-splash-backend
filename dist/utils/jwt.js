"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateRefreshToken = exports.generateAccessToken = exports.verifyCrossDomainAuthToken = exports.generateCrossDomainAuthToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Generates a temporary authentication token for cross-domain authentication
 * This token is used when users navigate from splash page to main app
 * Token expires in 10 minutes and includes user information
 */
const generateCrossDomainAuthToken = (userId, email, isApproved, hasProAccess) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    const payload = {
        userId,
        email,
        isApproved,
        hasProAccess,
        source: 'splash-page', // Indicates this token came from splash page
        type: 'cross-domain-auth' // Token type for validation
    };
    // Token expires in 10 minutes - short-lived for security
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '10m' });
};
exports.generateCrossDomainAuthToken = generateCrossDomainAuthToken;
/**
 * Verifies a cross-domain authentication token
 * Returns the decoded token payload if valid
 */
const verifyCrossDomainAuthToken = (token) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    // Validate token type
    if (decoded.type !== 'cross-domain-auth' || decoded.source !== 'splash-page') {
        throw new Error('Invalid token type');
    }
    return {
        userId: decoded.userId,
        email: decoded.email,
        isApproved: decoded.isApproved,
        hasProAccess: decoded.hasProAccess,
        source: decoded.source,
        type: decoded.type
    };
};
exports.verifyCrossDomainAuthToken = verifyCrossDomainAuthToken;
/**
 * Generates a standard access token (for future use if needed)
 */
const generateAccessToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '10m' });
};
exports.generateAccessToken = generateAccessToken;
/**
 * Generates a refresh token (for future use if needed)
 */
const generateRefreshToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Verifies a JWT token (generic)
 */
const verifyToken = (token) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
};
exports.verifyToken = verifyToken;

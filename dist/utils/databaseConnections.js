"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToWingmanDB = exports.connectToSplashDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
let splashDB;
let wingmanDB;
// Function to connect to splash page database (newWingman)
const connectToSplashDB = async () => {
    // Check if connection doesn't exist or is disconnected
    if (!splashDB || splashDB.readyState === 0) {
        // Create new connection to splash page database
        splashDB = await mongoose_1.default.createConnection(process.env.MONGO_URI);
        console.log('Connected to Splash Page DB (newWingman)');
    }
    return splashDB;
};
exports.connectToSplashDB = connectToSplashDB;
// Function to connect to main app database (vgWingman)
const connectToWingmanDB = async () => {
    // Check if connection doesn't exist or is disconnected
    if (!wingmanDB || wingmanDB.readyState === 0) {
        // Create new connection to main app database
        wingmanDB = await mongoose_1.default.createConnection(process.env.MONGODB_URI_WINGMAN);
        console.log('Connected to Video Game Wingman DB');
    }
    return wingmanDB;
};
exports.connectToWingmanDB = connectToWingmanDB;

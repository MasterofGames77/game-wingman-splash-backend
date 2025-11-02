"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const waitlist_1 = __importDefault(require("./routes/waitlist"));
const getWaitlistPosition_1 = __importDefault(require("./routes/getWaitlistPosition"));
const approveUser_1 = __importDefault(require("./routes/approveUser"));
const publicForumPosts_1 = __importDefault(require("./routes/publicForumPosts"));
// import publicQuestionResponsesRoute from './routes/publicQuestionResponses'; // Commented out - may not be needed for splash page
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        const whitelist = [
            'http://localhost:3000',
            'https://videogamewingman.com',
            'https://www.videogamewingman.com',
        ];
        // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
        if (!origin) {
            return callback(null, true);
        }
        // Check if origin is in whitelist
        if (whitelist.indexOf(origin) !== -1) {
            // Only log CORS in development to reduce console noise
            if (process.env.NODE_ENV === 'development') {
                console.log(`CORS request from origin: ${origin}`);
            }
            return callback(null, true);
        }
        // Always log blocked requests for security monitoring
        console.warn(`CORS request blocked from origin: ${origin}`);
        callback(new Error(`Not allowed by CORS policy. Origin: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on 204
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// MongoDB connection to Splash Page MongoDB
// Don't block server startup if DB connection fails - it will retry when needed
if (process.env.MONGO_URI) {
    mongoose_1.default.connect(process.env.MONGO_URI)
        .then(() => console.log('MongoDB (Splash Page) connected successfully'))
        .catch((err) => {
        console.error('MongoDB connection error (Splash Page):', err.message);
        // Don't exit - let server start and connections will retry when needed
    });
}
else {
    console.warn('MONGO_URI environment variable is not set. Database connections may fail.');
}
// Routes logging middleware (only in development to reduce console noise)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
        next();
    });
}
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api', waitlist_1.default);
app.use('/api', getWaitlistPosition_1.default);
app.use('/api', approveUser_1.default);
app.use('/api', publicForumPosts_1.default);
// app.use('/api', publicQuestionResponsesRoute); // Commented out - may not be needed for splash page
// Debug: Log registered routes (development only)
if (process.env.NODE_ENV === 'development') {
    console.log('Registered public forum posts route: /api/public/forum-posts');
}
// Global error-handling middleware
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Global error handler:`, err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) // Include stack trace in development mode
    });
});
// Health check endpoint (for debugging deployment)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: {
            hasMongoUri: !!process.env.MONGO_URI,
            hasWingmanDbUri: !!process.env.MONGODB_URI_WINGMAN,
            hasSplashForumId: !!process.env.SPLASH_PAGE_FORUM_ID,
            nodeEnv: process.env.NODE_ENV || 'not set',
        },
    });
});
// Start the server
app.listen(port, () => {
    console.log(`[${new Date().toISOString()}] Server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
});

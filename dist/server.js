"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const waitlist_1 = __importDefault(require("./routes/waitlist"));
const getWaitlistPosition_1 = __importDefault(require("./routes/getWaitlistPosition"));
const authMiddleware_1 = __importDefault(require("./middleware/authMiddleware"));
const approveUser_1 = __importDefault(require("./routes/approveUser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        const whitelist = [
            'http://localhost:3000',
            'https://game-wingman-splash-page.vercel.app'
        ];
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};
// Middleware
app.use((0, cors_1.default)(corsOptions)); // Apply the CORS middleware with options
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// MongoDB connection
mongoose_1.default.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('MongoDB connection error:', err));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api', authMiddleware_1.default, waitlist_1.default);
app.use('/api', authMiddleware_1.default, getWaitlistPosition_1.default);
app.use('/api', authMiddleware_1.default, approveUser_1.default);
// Global error-handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) // Include stack trace in development mode
    });
});
// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

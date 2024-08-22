import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import waitlistRoutes from './routes/waitlist';
import getWaitlistPositionRoute from './routes/getWaitlistPosition';
import authMiddleware from './middleware/authMiddleware';
import approveUserRoute from './routes/approveUser';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const whitelist = [
      'http://localhost:3000',
      'https://vgw-splash-page-frontend-71431835113b.herokuapp.com'
    ];
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

app.use(cors(corsOptions));

// Middleware
app.use(cors(corsOptions)); // Apply the CORS middleware with options
app.use(express.json());
app.use(cookieParser());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI!)
  .then(() => console.log('MongoDB connected'))
  .catch((err: any) => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', authMiddleware, waitlistRoutes);
app.use('/api', authMiddleware, getWaitlistPositionRoute);
app.use('/api', authMiddleware, approveUserRoute);

// Global error-handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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
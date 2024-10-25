import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import waitlistRoutes from './routes/waitlist';
import getWaitlistPositionRoute from './routes/getWaitlistPosition';
import approveUserRoute from './routes/approveUser';
import { connectToWingmanDB, connectToSplashDB } from './utils/databaseConnections';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const whitelist = [
      'http://localhost:3000',
      'https://vgw-splash-page-frontend-71431835113b.herokuapp.com',
    ];
    if (!origin || whitelist.indexOf(origin) !== -1) {
      console.log(`CORS request from origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`CORS request blocked from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json()); // Keep this to parse JSON bodies

// MongoDB connection to Splash Page MongoDB
mongoose.connect(process.env.MONGO_URI!)  // This connects to the Splash Page MongoDB
  .then(() => console.log('MongoDB (Splash Page) connected successfully'))
  .catch((err: any) => {
    console.error('MongoDB connection error (Splash Page):', err);
    process.exit(1); // Exit process with failure code if MongoDB connection fails
  });

// Connecting to Video Game Wingman DB
const setupWingmanDBConnection = async () => {
  try {
    await connectToWingmanDB();  // Connect to the Wingman DB
    console.log('Video Game Wingman DB connected successfully');
  } catch (error) {
    console.error('Error connecting to Video Game Wingman DB:', error);
    process.exit(1);  // Exit if connection fails
  }
};

// Connecting to Splash Page DB (explicit call)
const setupSplashDBConnection = async () => {
  try {
    await connectToSplashDB();  // Connect to the Splash Page DB
    console.log('Splash Page DB connected successfully');
  } catch (error) {
    console.error('Error connecting to Splash Page DB:', error);
    process.exit(1);  // Exit if connection fails
  }
};

// Call the functions to connect to both databases
setupWingmanDBConnection();
setupSplashDBConnection();

// Routes logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', waitlistRoutes);
app.use('/api', getWaitlistPositionRoute);
app.use('/api', approveUserRoute);

// Global error-handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[${new Date().toISOString()}] Global error handler:`, err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) // Include stack trace in development mode
  });
});

// Start the server
app.listen(port, () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${port}`);
});
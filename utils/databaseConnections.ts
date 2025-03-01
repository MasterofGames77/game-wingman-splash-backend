import mongoose from 'mongoose';

// Cache database connections
let splashDB: mongoose.Connection;
let wingmanDB: mongoose.Connection;

// Common connection options for better performance and reliability
const connectionOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: 'majority'
};

// Function to connect to splash page database (newWingman)
export const connectToSplashDB = async (): Promise<mongoose.Connection> => {
  try {
    // Check if connection exists and is ready
    if (splashDB?.readyState === 1) {
      return splashDB;
    }

    // Create new connection to splash page database
    splashDB = mongoose.createConnection(process.env.MONGO_URI!, {
      ...connectionOptions,
      dbName: 'newWingman'
    });

    // Handle connection errors
    splashDB.on('error', (error) => {
      console.error('Splash Page DB connection error:', error);
      splashDB.readyState === 0 && process.env.NODE_ENV === 'production' && process.exit(1);
    });

    // Wait for connection to be ready
    await new Promise<void>((resolve) => {
      splashDB.once('connected', () => {
        console.log('Connected to Splash Page DB (newWingman)');
        resolve();
      });
    });

    return splashDB;
  } catch (error) {
    console.error('Failed to connect to Splash Page DB:', error);
    throw error;
  }
};

// Function to connect to main app database (vgWingman)
export const connectToWingmanDB = async (): Promise<mongoose.Connection> => {
  try {
    // Check if connection exists and is ready
    if (wingmanDB?.readyState === 1) {
      return wingmanDB;
    }

    // Create new connection to main app database
    wingmanDB = mongoose.createConnection(process.env.MONGODB_URI_WINGMAN!, {
      ...connectionOptions,
      dbName: 'vgWingman'
    });

    // Handle connection errors
    wingmanDB.on('error', (error) => {
      console.error('Video Game Wingman DB connection error:', error);
      wingmanDB.readyState === 0 && process.env.NODE_ENV === 'production' && process.exit(1);
    });

    // Wait for connection to be ready
    await new Promise<void>((resolve) => {
      wingmanDB.once('connected', () => {
        console.log('Connected to Video Game Wingman DB');
        resolve();
      });
    });

    return wingmanDB;
  } catch (error) {
    console.error('Failed to connect to Video Game Wingman DB:', error);
    throw error;
  }
};
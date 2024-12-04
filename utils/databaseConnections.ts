import mongoose from 'mongoose';

let splashDB: mongoose.Connection;
let wingmanDB: mongoose.Connection;

// Function to connect to splash page database (newWingman)
export const connectToSplashDB = async (): Promise<mongoose.Connection> => {
  // Check if connection doesn't exist or is disconnected
  if (!splashDB || splashDB.readyState === 0) {
    // Create new connection to splash page database
    splashDB = await mongoose.createConnection(process.env.MONGO_URI!);
    console.log('Connected to Splash Page DB (newWingman)');
  }
  return splashDB;
};

// Function to connect to main app database (vgWingman)
export const connectToWingmanDB = async (): Promise<mongoose.Connection> => {
  // Check if connection doesn't exist or is disconnected
  if (!wingmanDB || wingmanDB.readyState === 0) {
    // Create new connection to main app database
    wingmanDB = await mongoose.createConnection(process.env.MONGODB_URI_WINGMAN!);
    console.log('Connected to Video Game Wingman DB');
  }
  return wingmanDB;
};
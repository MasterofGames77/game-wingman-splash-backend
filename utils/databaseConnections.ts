import mongoose from 'mongoose';

let splashDB: mongoose.Connection;
let wingmanDB: mongoose.Connection;

export const connectToSplashDB = async (): Promise<mongoose.Connection> => {
  if (!splashDB || splashDB.readyState === 0) {
    splashDB = await mongoose.createConnection(process.env.MONGO_URI!);
    console.log('Connected to Splash Page DB (newWingman)');
  }
  return splashDB;
};

export const connectToWingmanDB = async (): Promise<mongoose.Connection> => {
  if (!wingmanDB || wingmanDB.readyState === 0) {
    wingmanDB = await mongoose.createConnection(process.env.MONGODB_URI_WINGMAN!);
    console.log('Connected to Video Game Wingman DB');
  }
  return wingmanDB;
};
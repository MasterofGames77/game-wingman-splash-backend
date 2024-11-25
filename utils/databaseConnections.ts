// import mongoose from 'mongoose';

// let splashDB: mongoose.Connection;
// let wingmanDB: mongoose.Connection;

// // Connect to Splash Page MongoDB
// export const connectToSplashDB = async (): Promise<mongoose.Connection> => {
//   const splashUri = process.env.SPLASH_PAGE_MONGO_URI;

//   if (!splashUri) {
//     throw new Error('SPLASH_PAGE_MONGO_URI is not defined in the environment variables');
//   }

//   if (!splashDB || splashDB.readyState === 0) {
//     try {
//       splashDB = mongoose.createConnection(splashUri);

//       splashDB.on('connected', () => {
//         console.log('Connected to Splash Page DB (newWingman)');
//       });

//       splashDB.on('error', (error) => {
//         console.error('Error connecting to Splash Page DB (newWingman):', error);
//       });
//     } catch (error) {
//       throw new Error(`Failed to connect to Splash Page DB: ${(error as Error).message}`);
//     }
//   }

//   return splashDB;
// };

// // Connect to Video Game Wingman Database
// export const connectToWingmanDB = async (): Promise<mongoose.Connection> => {
//   const wingmanUri = process.env.MONGODB_URI_WINGMAN;

//   if (!wingmanUri) {
//     throw new Error('MONGODB_URI_WINGMAN is not defined in the environment variables');
//   }

//   if (!wingmanDB || wingmanDB.readyState === 0) {
//     try {
//       wingmanDB = mongoose.createConnection(wingmanUri);

//       await new Promise<void>((resolve, reject) => {
//         wingmanDB.on('connected', () => {
//           console.log('Connected to Video Game Wingman DB');
//           resolve();
//         });

//         wingmanDB.on('error', (error) => {
//           console.error('Error connecting to Video Game Wingman DB:', error);
//           reject(error);
//         });
//       });
//     } catch (error) {
//       throw new Error(`Failed to connect to Wingman DB: ${(error as Error).message}`);
//     }
//   }

//   return wingmanDB;
// };

// // Connect to Both Databases
// export const connectToDatabases = async () => {
//   const splashDBConnection = await connectToSplashDB();
//   const assistantDBConnection = await connectToWingmanDB();

//   return { splashDBConnection, assistantDBConnection };
// };

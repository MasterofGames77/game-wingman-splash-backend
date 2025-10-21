"use strict";
// Obselete
// import { connectToSplashDB, connectToWingmanDB } from '../utils/databaseConnections';
// import SplashUser from '../models/User';
// const checkProAccess = async (userId: string): Promise<void> => {
//   try {
//     console.log(`Checking Pro Access for userId: ${userId}`);
//     // Connect to Wingman DB and find the user in the Assistant DB
//     const assistantDB = await connectToWingmanDB();
//     const assistantUser = await assistantDB.collection('userID').findOne({ userId });
//     if (!assistantUser) {
//       console.error(`User with userId: ${userId} not found in the Assistant DB.`);
//       throw new Error('User not found in Video Game Wingman database.');
//     }
//     console.log(`User found in Assistant DB: ${assistantUser.email}`);
//     // Connect to Splash Page DB and find the user by email
//     const splashDB = await connectToSplashDB();
//     const SplashUserModel = splashDB.model('User', SplashUser.schema);
//     const splashUser = await SplashUserModel.findOne({ email: assistantUser.email });
//     if (!splashUser) {
//       console.error(`User with email: ${assistantUser.email} not found in the Splash Page DB.`);
//       throw new Error('User not found in Splash Page database.');
//     }
//     console.log(`User found in Splash Page DB: ${splashUser.email}`);
//     // Check if the user is approved and does not already have Pro Access
//     if (splashUser.isApproved && !assistantUser.hasProAccess) {
//       // Grant Pro Access in the Assistant DB
//       await assistantDB
//         .collection('userID')
//         .updateOne({ userId }, { $set: { hasProAccess: true } });
//       console.log(`Pro Access granted for user: ${assistantUser.email}.`);
//     } else if (!splashUser.isApproved) {
//       console.log(`User ${assistantUser.email} is not approved for Pro Access.`);
//     } else {
//       console.log(`User ${assistantUser.email} already has Pro Access.`);
//     }
//   } catch (error) {
//     console.error('Error checking Pro Access:', error);
//     throw error;
//   }
// };
// export default checkProAccess;

// import { connectToSplashDB } from '../utils/databaseConnections';
// import User, { IUser } from '../models/User';  // Import IUser for typing

// const checkProAccess = async (userId: string) => {
//   // Find the user in the Wingman DB and type it with IUser
//   const wingmanUser = await User.findOne({ userId }) as IUser | null;

//   if (!wingmanUser) {
//     throw new Error('User not found in Video Game Wingman database.');
//   }

//   // Connect to Splash Page DB to check Pro Access
//   const splashConnection = await connectToSplashDB();
//   const SplashUser = splashConnection.model('User', User.schema);

//   // Find the user by email in the splash page DB
//   const splashUser = await SplashUser.findOne({ email: wingmanUser.email });
//   if (splashUser && splashUser.isApproved) {
//     // Update Pro Access in Wingman DB
//     wingmanUser.hasProAccess = true;
//     await wingmanUser.save();
//     console.log(`${wingmanUser.email} has been granted Pro Access in Video Game Wingman.`);
//   } else {
//     console.log(`${wingmanUser.email} does not have Pro Access in the splash page.`);
//   }
// };

// export default checkProAccess;

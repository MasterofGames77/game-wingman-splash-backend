import { connectToSplashDB, connectToWingmanDB } from '../utils/databaseConnections';
import SplashUser from '../models/User';

const checkProAccess = async (userId: string): Promise<void> => {
  try {
    // Connect to Wingman DB
    const assistantDB = await connectToWingmanDB();
    const assistantUser = await assistantDB.collection('userID').findOne({ userId });

    if (!assistantUser) {
      throw new Error('User not found in Video Game Wingman database.');
    }

    // Connect to Splash Page DB
    const splashDB = await connectToSplashDB();
    const SplashUserModel = splashDB.model('User', SplashUser.schema);
    const splashUser = await SplashUserModel.findOne({ email: assistantUser.email });

    if (!splashUser) {
      throw new Error('User not found in Splash Page database.');
    }

    if (splashUser.isApproved && !assistantUser.hasProAccess) {
      // Update Pro Access in Assistant DB
      await assistantDB
        .collection('userID')
        .updateOne({ userId }, { $set: { hasProAccess: true } });

      console.log(`Pro Access granted for user ${assistantUser.email}.`);
    } else if (!splashUser.isApproved) {
      console.log(`User ${assistantUser.email} is not approved for Pro Access.`);
    } else {
      console.log(`User ${assistantUser.email} already has Pro Access.`);
    }
  } catch (error) {
    console.error('Error checking Pro Access:', error);
    throw error;
  }
};

export default checkProAccess;
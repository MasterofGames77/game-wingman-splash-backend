import { connectToSplashDB, connectToWingmanDB } from './databaseConnections';
import { IUser } from '../models/User';

export const syncUserToWingman = async (splashUser: IUser) => {
  // Connect to main app database
  const wingmanDB = await connectToWingmanDB();
  
  // Check pro access eligibility
  const signupDate = new Date(splashUser.userId.split('-')[1]); // Extract date from userId
  const proDeadline = new Date('2025-07-31T23:59:59.999Z');
  const hasProAccess = (
    (typeof splashUser.position === 'number' && splashUser.position <= 5000) || // First 5000 users
    signupDate <= proDeadline // Or signed up before deadline
  );
  
  // Set up initial progress tracking
  const defaultProgress = {
    firstQuestion: 0,
    frequentAsker: 0,
    rpgEnthusiast: 0,
    bossBuster: 0,
    strategySpecialist: 0,
    actionAficionado: 0,
    battleRoyale: 0,
    sportsChampion: 0,
    adventureAddict: 0,
    shooterSpecialist: 0,
    puzzlePro: 0,
    racingExpert: 0,
    stealthSpecialist: 0,
    horrorHero: 0,
    triviaMaster: 0,
    totalQuestions: 0,
    dailyExplorer: 0,
    speedrunner: 0,
    collectorPro: 0,
    dataDiver: 0,
    performanceTweaker: 0,
    conversationalist: 0
  };

  // Update or create user in main database
  await wingmanDB.collection('users').findOneAndUpdate(
    { email: splashUser.email }, // Find by email
    {
      $setOnInsert: { // Only set these fields if creating new document
        email: splashUser.email,
        userId: splashUser.userId,
        position: null, // Remove waitlist position
        isApproved: true,
        hasProAccess,
        conversationCount: 0,
        achievements: [],
        progress: defaultProgress
      }
    },
    { upsert: true } // Create if doesn't exist
  );
}; 
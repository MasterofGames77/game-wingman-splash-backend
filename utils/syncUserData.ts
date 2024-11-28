import { connectToSplashDB, connectToWingmanDB } from './databaseConnections';
import { IUser } from '../models/User';

export const syncUserToWingman = async (splashUser: IUser) => {
  const wingmanDB = await connectToWingmanDB();
  
  const hasProAccess = typeof splashUser.position === 'number' && splashUser.position <= 5000;
  
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

  await wingmanDB.collection('users').findOneAndUpdate(
    { email: splashUser.email },
    {
      $setOnInsert: {
        email: splashUser.email,
        userId: splashUser.userId,
        position: null,
        isApproved: true,
        hasProAccess,
        conversationCount: 0,
        achievements: [],
        progress: defaultProgress
      }
    },
    { upsert: true }
  );
}; 
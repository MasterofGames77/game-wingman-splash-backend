"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncUserToWingman = void 0;
const databaseConnections_1 = require("./databaseConnections");
// Cache database connection
let wingmanDBConnection = null;
// Memoize default progress object to avoid recreation on each call
const DEFAULT_PROGRESS = Object.freeze({
    firstQuestion: 0,
    frequentAsker: 0,
    rpgEnthusiast: 0,
    bossBuster: 0,
    platformerPro: 0,
    survivalSpecialist: 0,
    strategySpecialist: 0,
    simulationSpecialist: 0,
    fightingFanatic: 0,
    actionAficionado: 0,
    battleRoyale: 0,
    sportsChampion: 0,
    adventureAddict: 0,
    shooterSpecialist: 0,
    puzzlePro: 0,
    racingRenegade: 0,
    stealthExpert: 0,
    horrorHero: 0,
    triviaMaster: 0,
    storySeeker: 0,
    beatEmUpBrawler: 0,
    rhythmMaster: 0,
    sandboxBuilder: 0,
    totalQuestions: 0,
    dailyExplorer: 0,
    speedrunner: 0,
    collectorPro: 0,
    dataDiver: 0,
    performanceTweaker: 0,
    conversationalist: 0,
    proAchievements: {
        gameMaster: 0,
        speedDemon: 0,
        communityLeader: 0,
        achievementHunter: 0,
        proStreak: 0,
        expertAdvisor: 0,
        genreSpecialist: 0,
        proContributor: 0
    }
});
// Cache pro deadline to avoid creating Date object repeatedly
const PRO_DEADLINE = new Date('2025-12-31T23:59:59.999Z').getTime();
const syncUserToWingman = async (splashUser) => {
    try {
        // Reuse existing connection if available
        if (!wingmanDBConnection) {
            const db = await (0, databaseConnections_1.connectToWingmanDB)();
            if (!db)
                throw new Error('Failed to connect to Wingman database');
            wingmanDBConnection = db;
        }
        // Extract timestamp directly from userId for better performance
        // Format: user-{timestamp}-{randomSuffix} (new) or user-{timestamp} (old)
        // The timestamp is always at index 1 after splitting by '-'
        const signupTimestamp = parseInt(splashUser.userId.split('-')[1], 10);
        // Use the hasProAccess from splash page data, with fallback logic
        const hasProAccess = splashUser.hasProAccess || ((typeof splashUser.position === 'number' && splashUser.position <= 5000) ||
            signupTimestamp <= PRO_DEADLINE);
        console.log(`Syncing user to main application: email=${splashUser.email}, userId=${splashUser.userId}, hasProAccess=${hasProAccess}`);
        // Use updateOne with upsert - ensure userId is always set correctly
        const result = await wingmanDBConnection.collection('users').updateOne({ email: splashUser.email }, {
            $set: {
                userId: splashUser.userId, // Always update userId if user exists
                isApproved: true,
                hasProAccess
            },
            $setOnInsert: {
                email: splashUser.email,
                position: null,
                conversationCount: 0,
                achievements: [],
                progress: DEFAULT_PROGRESS
            }
        }, {
            upsert: true,
            writeConcern: { w: 1 }
        });
        if (result.upsertedCount > 0) {
            console.log(`Successfully inserted new user ${splashUser.email} (${splashUser.userId}) into main application database`);
        }
        else if (result.matchedCount > 0) {
            console.log(`Successfully updated existing user ${splashUser.email} with userId ${splashUser.userId} in main application database`);
        }
    }
    catch (error) {
        console.error(`Error syncing user ${splashUser.email} (${splashUser.userId}) to Wingman:`, error);
        wingmanDBConnection = null;
        throw error;
    }
};
exports.syncUserToWingman = syncUserToWingman;

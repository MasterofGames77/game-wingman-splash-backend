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
        const signupTimestamp = parseInt(splashUser.userId.split('-')[1], 10);
        // Optimize pro access check
        const hasProAccess = ((typeof splashUser.position === 'number' && splashUser.position <= 5000) ||
            signupTimestamp <= PRO_DEADLINE);
        // Use updateOne for better performance
        await wingmanDBConnection.collection('users').updateOne({ email: splashUser.email }, {
            $setOnInsert: {
                email: splashUser.email,
                userId: splashUser.userId,
                position: null,
                isApproved: true,
                hasProAccess,
                conversationCount: 0,
                achievements: [],
                progress: DEFAULT_PROGRESS
            }
        }, {
            upsert: true,
            writeConcern: { w: 1 }
        });
    }
    catch (error) {
        console.error('Error syncing user to Wingman:', error);
        wingmanDBConnection = null;
        throw error;
    }
};
exports.syncUserToWingman = syncUserToWingman;

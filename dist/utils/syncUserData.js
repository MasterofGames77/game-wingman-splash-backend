"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncUserToWingman = void 0;
const databaseConnections_1 = require("./databaseConnections");
const checkProAccess_1 = require("./checkProAccess");
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
    battleRoyaleMaster: 0,
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
    shootemUpSniper: 0,
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
const syncUserToWingman = async (splashUser) => {
    try {
        // Reuse existing connection if available
        if (!wingmanDBConnection) {
            const db = await (0, databaseConnections_1.connectToWingmanDB)();
            if (!db)
                throw new Error('Failed to connect to Wingman database');
            wingmanDBConnection = db;
        }
        // Check pro access eligibility based on signup timestamp and position
        // If position is null (user already approved), we use the hasProAccess value
        // that was calculated during approval, but we still verify the deadline
        let hasProAccess;
        if (splashUser.position === null) {
            // User is already approved - use the hasProAccess value that was set during approval
            // But verify the deadline is still respected
            const timestampStr = splashUser.userId.split('-')[1];
            const signupTimestamp = timestampStr ? parseInt(timestampStr, 10) : NaN;
            const signedUpBeforeDeadline = !isNaN(signupTimestamp) && signupTimestamp <= (0, checkProAccess_1.getProDeadline)();
            // Only grant pro access if they signed up before deadline AND hasProAccess was set to true
            // (hasProAccess would have been calculated correctly during approval with original position)
            hasProAccess = signedUpBeforeDeadline && splashUser.hasProAccess === true;
        }
        else {
            // User not yet approved - check eligibility based on position and deadline
            hasProAccess = (0, checkProAccess_1.checkProAccessEligibility)(splashUser.userId, splashUser.position);
        }
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

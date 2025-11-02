"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const databaseConnections_1 = require("../utils/databaseConnections");
const router = (0, express_1.Router)();
/**
 * GET /api/public/question-responses
 * Returns a limited number of question-response pairs for preview on the splash page
 * Query params:
 *   - limit: number of pairs to return (default: 2, max: 5)
 */
router.get('/public/question-responses', async (req, res) => {
    try {
        // Parse and validate limit parameter
        const limitParam = req.query.limit;
        let limit = 2; // default limit
        if (limitParam) {
            const parsedLimit = parseInt(String(limitParam), 10);
            if (!isNaN(parsedLimit) && parsedLimit > 0) {
                limit = Math.min(parsedLimit, 5); // cap at 5 for performance
            }
        }
        // Connect to main application database
        const wingmanDB = await (0, databaseConnections_1.connectToWingmanDB)();
        const db = wingmanDB.db;
        if (!db) {
            throw new Error('Failed to connect to database');
        }
        // Query question-response pairs from the main database
        // Note: Collection name may need to be adjusted based on actual schema
        // Common collection names: 'conversations', 'questions', 'questionResponses', 'qa', etc.
        const conversationsCollection = db.collection('conversations');
        // Fetch conversations that have both question and response
        // Exclude sensitive fields and only return public preview data
        const conversations = await conversationsCollection
            .find({
            // Filter for conversations that have questions and responses
            // Adjust these field names based on actual schema
            $or: [
                { messages: { $exists: true, $ne: [] } },
                { question: { $exists: true } },
                { userMessage: { $exists: true } }
            ]
        }, {
            projection: {
                _id: 0, // Exclude MongoDB _id
                question: 1,
                userMessage: 1,
                messages: 1,
                response: 1,
                assistantMessage: 1,
                timestamp: 1,
                createdAt: 1,
                date: 1,
                // Exclude sensitive fields like userId, email, sessionId, etc.
            }
        })
            .sort({ timestamp: -1, createdAt: -1, date: -1 }) // Most recent first
            .limit(limit)
            .toArray();
        // Transform data to ensure consistent response format
        const previewPairs = conversations.map((conv) => {
            // Extract question from various possible field names
            let question = conv.question || conv.userMessage || '';
            if (conv.messages && Array.isArray(conv.messages)) {
                // Find the first user message
                const userMsg = conv.messages.find((msg) => msg.role === 'user' || msg.type === 'user' || msg.from === 'user');
                if (userMsg && userMsg.content) {
                    question = userMsg.content;
                }
                else if (conv.messages[0] && conv.messages[0].content) {
                    question = conv.messages[0].content;
                }
            }
            // Extract response from various possible field names
            let response = conv.response || conv.assistantMessage || '';
            if (conv.messages && Array.isArray(conv.messages)) {
                // Find the first assistant message
                const assistantMsg = conv.messages.find((msg) => msg.role === 'assistant' || msg.type === 'assistant' || msg.from === 'assistant');
                if (assistantMsg && assistantMsg.content) {
                    response = assistantMsg.content;
                }
                else if (conv.messages.length > 1 && conv.messages[1] && conv.messages[1].content) {
                    response = conv.messages[1].content;
                }
            }
            // Create response snippet (first 500 characters)
            const responseSnippet = response
                ? (response.length > 500 ? response.substring(0, 500) + '...' : response)
                : '';
            return {
                question: question || 'No question available',
                responseSnippet,
                timestamp: conv.timestamp || conv.createdAt || conv.date || new Date().toISOString(),
            };
        }).filter((pair) => pair.question && pair.responseSnippet); // Only include pairs with both question and response
        return res.status(200).json({
            success: true,
            questionResponses: previewPairs,
            count: previewPairs.length,
        });
    }
    catch (error) {
        console.error('Error fetching question-responses for preview:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch question-responses',
            // Include error details in development only
            ...(process.env.NODE_ENV === 'development' && { error: error instanceof Error ? error.message : 'Unknown error' })
        });
    }
});
exports.default = router;

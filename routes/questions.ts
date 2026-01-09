import { Request, Response, Router } from 'express';
import Question from '../models/Question';
import User from '../models/User';
import { checkContentModeration } from '../utils/contentModeration';
import { getChatCompletion, extractGameTitleFromQuestion, fetchGenresFromIGDB } from '../utils/aiHelper';
import { isEmail } from 'validator';

const router = Router();

/**
 * POST /api/questions
 * Ask a question to Video Game Wingman
 * 
 * Body: { email: string, question: string }
 * 
 * Returns: { question: IQuestion, message: string }
 */
router.post('/questions', async (req: Request, res: Response) => {
  try {
    const { email, question } = req.body;

    // Validate input
    if (!email || !isEmail(email)) {
      return res.status(400).json({ 
        message: 'Valid email is required' 
      });
    }

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Question is required and must be a non-empty string' 
      });
    }

    // Check if user exists in waitlist
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ 
        message: 'Email not found. Please sign up for early access first.' 
      });
    }

    // Check if user already has an active question
    const existingQuestion = await Question.findOne({ 
      email: email.toLowerCase().trim() 
    }).sort({ timestamp: -1 }); // Get most recent question

    if (existingQuestion) {
      return res.status(409).json({
        message: 'You already have a question. Please delete your existing question before asking a new one.',
        existingQuestion: {
          id: existingQuestion._id,
          question: existingQuestion.question,
          response: existingQuestion.response,
          timestamp: existingQuestion.timestamp
        }
      });
    }

    // Content moderation check
    const moderationResult = await checkContentModeration(question);
    if (!moderationResult.isSafe) {
      return res.status(400).json({
        message: moderationResult.message || 'Your question contains inappropriate content. Please remove any offensive words or phrases and try again.',
        detectedWords: moderationResult.detectedWords
      });
    }

    // Generate AI response
    let aiResponse: string | null;
    try {
      aiResponse = await getChatCompletion(question);
      
      if (!aiResponse) {
        return res.status(500).json({
          message: 'Failed to generate response. Please try again later.'
        });
      }
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      
      // Handle specific error types
      if (error.message?.includes('rate limit')) {
        return res.status(429).json({
          message: 'Rate limit exceeded. Please wait a moment and try again.'
        });
      }
      
      return res.status(500).json({
        message: 'An error occurred while generating the response. Please try again later.'
      });
    }

    // Extract game title (optional metadata)
    let detectedGame: string | undefined;
    try {
      detectedGame = await extractGameTitleFromQuestion(question);
    } catch (error) {
      // Non-critical, continue without game title
      console.error('Error extracting game title:', error);
    }

    // Extract genres if game title was detected
    let detectedGenre: string[] | undefined;
    if (detectedGame) {
      try {
        detectedGenre = await fetchGenresFromIGDB(detectedGame) || undefined;
        if (detectedGenre) {
          // console.log(`[Genre Detection] Found genres for "${detectedGame}":`, detectedGenre);
        }
      } catch (error) {
        // Non-critical, continue without genres
        console.error('Error extracting genres:', error);
      }
    }

    // Create and save question
    const questionDoc = new Question({
      email: email.toLowerCase().trim(),
      question: question.trim(),
      response: aiResponse,
      detectedGame: detectedGame,
      detectedGenre: detectedGenre
    });

    await questionDoc.save();

    // Return the created question
    return res.status(201).json({
      message: 'Question submitted successfully',
      question: {
        id: questionDoc._id,
        email: questionDoc.email,
        question: questionDoc.question,
        response: questionDoc.response,
        timestamp: questionDoc.timestamp,
        detectedGame: questionDoc.detectedGame
      }
    });

  } catch (error: any) {
    console.error('Error in POST /api/questions:', error);
    return res.status(500).json({
      message: 'An error occurred while processing your question. Please try again later.'
    });
  }
});

/**
 * DELETE /api/questions/:id
 * Delete a question by ID
 * 
 * Params: id (question ID)
 * Body: { email: string } (to verify ownership)
 * 
 * Returns: { message: string }
 */
router.delete('/questions/:id', async (req: Request, res: Response) => {
  try {
    const questionId = req.params.id;
    const { email } = req.body;

    // Validate input
    if (!email || !isEmail(email)) {
      return res.status(400).json({ 
        message: 'Valid email is required in request body to verify ownership' 
      });
    }

    if (!questionId) {
      return res.status(400).json({ 
        message: 'Question ID is required' 
      });
    }

    // Find the question
    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({
        message: 'Question not found'
      });
    }

    // Verify ownership (email must match)
    if (question.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
      return res.status(403).json({
        message: 'You do not have permission to delete this question'
      });
    }

    // Delete the question (hard delete)
    await Question.deleteOne({ _id: questionId });

    return res.status(200).json({
      message: 'Question deleted successfully'
    });

  } catch (error: any) {
    console.error('Error in DELETE /api/questions/:id:', error);
    return res.status(500).json({
      message: 'An error occurred while deleting the question. Please try again later.'
    });
  }
});

/**
 * GET /api/questions
 * Get user's question by email
 * 
 * Query: ?email=user@example.com
 * 
 * Returns: { question: IQuestion | null }
 */
router.get('/questions', async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;

    // Validate input
    if (!email || !isEmail(email)) {
      return res.status(400).json({ 
        message: 'Valid email query parameter is required' 
      });
    }

    // Find user's question
    const question = await Question.findOne({ 
      email: email.toLowerCase().trim() 
    }).sort({ timestamp: -1 }); // Get most recent question

    if (!question) {
      return res.status(200).json({
        question: null,
        message: 'No question found for this email'
      });
    }

    return res.status(200).json({
      question: {
        id: question._id,
        email: question.email,
        question: question.question,
        response: question.response,
        timestamp: question.timestamp,
        detectedGame: question.detectedGame,
        detectedGenre: question.detectedGenre,
        imageUrl: question.imageUrl
      }
    });

  } catch (error: any) {
    console.error('Error in GET /api/questions:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching your question. Please try again later.'
    });
  }
});

export default router;

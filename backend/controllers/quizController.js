const { generateQuizQuestions } = require('../services/aiService');

/**
 * Controller for generating a quiz using LLM.
 * Route: POST /api/quiz/generate
 * Payload: { topic: string, difficulty?: string, count?: number }
 */
const generateQuiz = async (req, res) => {
  try {
    const { topic, difficulty = 'medium', count = 5 } = req.body;

    // Validate incoming topic
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid "topic" string in the request body.',
      });
    }

    // Normalize and validate difficulty level
    const normalizedDifficulty = difficulty.toLowerCase().trim();
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(normalizedDifficulty)) {
      return res.status(400).json({
        success: false,
        error: `Invalid difficulty "${difficulty}". Allowed values are: ${validDifficulties.join(', ')}.`,
      });
    }

    // Validate question count (bounded between 1 and 15 for safety/rate limits)
    const questionCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 15);

    // Call the LLM service to generate questions
    const generatedQuiz = await generateQuizQuestions(
      topic.trim(),
      normalizedDifficulty,
      questionCount
    );

    return res.status(200).json({
      success: true,
      message: 'Quiz generated successfully',
      data: generatedQuiz,
    });
  } catch (error) {
    console.error('Quiz Generation Error:', error.message);

    // Handle missing API key or config error
    if (error.message.includes('API_KEY')) {
      return res.status(500).json({
        success: false,
        error: error.message,
        hint: 'Please configure GEMINI_API_KEY or OPENAI_API_KEY in backend/.env',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to generate quiz from LLM',
      details: error.message,
    });
  }
};

module.exports = {
  generateQuiz,
};

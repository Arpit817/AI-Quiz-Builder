const mongoose = require('mongoose');
const { generateQuizQuestions } = require('../services/aiService');
const { validateAndRepairQuiz } = require('../utils/quizValidator');
const Quiz = require('../models/Quiz');

/**
 * Controller for generating a quiz using LLM.
 * Passes raw output through the Validation Layer before saving to MongoDB.
 * 
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

    // 1. Call the LLM service to generate raw questions
    const rawGeneratedQuiz = await generateQuizQuestions(
      topic.trim(),
      normalizedDifficulty,
      questionCount
    );

    // 2. Validation & Repair Layer: reject or repair malformed AI questions
    const validatedQuizData = validateAndRepairQuiz(
      rawGeneratedQuiz,
      topic.trim(),
      normalizedDifficulty
    );

    // 3. Persist to MongoDB before responding
    let resultPayload = validatedQuizData;
    let isSaved = false;

    // Connect if not already connected
    if (mongoose.connection.readyState !== 1) {
      const connectDB = require('../config/db');
      await connectDB();
    }

    if (mongoose.connection.readyState === 1) {
      const newQuiz = new Quiz({
        title: validatedQuizData.topic,
        topic: validatedQuizData.topic,
        difficulty: validatedQuizData.difficulty,
        questions: validatedQuizData.questions,
        createdBy: req.user?._id || null, // Prepared for Phase 4 Auth
      });

      resultPayload = await newQuiz.save();
      isSaved = true;
    }

    return res.status(201).json({
      success: true,
      message: isSaved
        ? 'Quiz generated, validated, and saved to database successfully'
        : 'Quiz generated and validated successfully (MongoDB offline)',
      savedToDatabase: isSaved,
      data: resultPayload,
    });
  } catch (error) {
    console.error('Quiz Generation Error:', error.message);

    // Handle AI output validation failure
    if (error.message.includes('AI output') || error.message.includes('malformed') || error.name === 'ValidationError') {
      return res.status(422).json({
        success: false,
        error: 'AI output validation failed',
        details: error.message,
      });
    }

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

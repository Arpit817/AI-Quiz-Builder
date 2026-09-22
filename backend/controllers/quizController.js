const mongoose = require('mongoose');
const { generateQuizQuestions } = require('../services/aiService');
const { validateAndRepairQuiz } = require('../utils/quizValidator');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');

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

/**
 * Controller for retrieving a quiz for taking.
 * CRITICAL SECURITY REQUIREMENT: Never expose correctAnswerIndex to client.
 * 
 * Route: GET /api/quiz/:id
 */
const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quiz ID format.',
      });
    }

    // Connect if not already connected
    if (mongoose.connection.readyState !== 1) {
      const connectDB = require('../config/db');
      await connectDB();
    }

    const quiz = await Quiz.findById(id).lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found.',
      });
    }

    // Never expose correctAnswerIndex in taking API
    const sanitizedQuestions = (quiz.questions || []).map((q) => {
      const { correctAnswerIndex, ...safeQuestion } = q;
      return safeQuestion;
    });

    return res.status(200).json({
      success: true,
      data: {
        ...quiz,
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    console.error('Get Quiz By ID Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz',
      details: error.message,
    });
  }
};

/**
 * Controller for submitting and grading a quiz.
 * Performs server-side grading only and persists attempt history.
 * 
 * Route: POST /api/quiz/:id/submit
 * Payload: { answers: [ { questionIndex: number, selectedOptionIndex: number }, ... ] }
 *          or answers: [ selectedOptionIndex0, selectedOptionIndex1, ... ]
 */
const submitQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quiz ID format.',
      });
    }

    // Validate answers payload
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an "answers" array in the request body.',
      });
    }

    // Connect if not already connected
    if (mongoose.connection.readyState !== 1) {
      const connectDB = require('../config/db');
      await connectDB();
    }

    const quiz = await Quiz.findById(id).lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found.',
      });
    }

    // Server-side grading logic
    let score = 0;
    const totalQuestions = quiz.questions ? quiz.questions.length : 0;
    const gradedBreakdown = [];
    const attemptAnswers = [];

    (quiz.questions || []).forEach((q, index) => {
      let selectedOptionIndex = null;

      // Match answer either by object { questionIndex, selectedOptionIndex } or direct array index
      const matchingAnswerObj = answers.find(
        (ans) =>
          ans &&
          typeof ans === 'object' &&
          (ans.questionIndex === index ||
            (ans.questionId && q._id && ans.questionId.toString() === q._id.toString()))
      );

      if (matchingAnswerObj) {
        selectedOptionIndex =
          matchingAnswerObj.selectedOptionIndex ??
          matchingAnswerObj.selectedOption ??
          matchingAnswerObj.answerIndex ??
          null;
      } else if (typeof answers[index] === 'number') {
        selectedOptionIndex = answers[index];
      } else if (typeof answers[index] === 'string' && !isNaN(parseInt(answers[index], 10))) {
        selectedOptionIndex = parseInt(answers[index], 10);
      }

      const isValidSelection =
        typeof selectedOptionIndex === 'number' &&
        Number.isInteger(selectedOptionIndex) &&
        selectedOptionIndex >= 0 &&
        selectedOptionIndex < (q.options ? q.options.length : 4);

      const normalizedSelection = isValidSelection ? selectedOptionIndex : -1;
      const isCorrect = isValidSelection && selectedOptionIndex === q.correctAnswerIndex;

      if (isCorrect) {
        score++;
      }

      attemptAnswers.push({
        questionIndex: index,
        selectedOptionIndex: normalizedSelection,
        isCorrect,
      });

      gradedBreakdown.push({
        questionIndex: index,
        questionId: q._id,
        questionText: q.questionText,
        options: q.options,
        selectedOptionIndex: normalizedSelection,
        correctAnswerIndex: q.correctAnswerIndex,
        isCorrect,
        explanation: q.explanation || '',
      });
    });

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    // Persist attempt to MongoDB
    let attemptId = null;
    if (mongoose.connection.readyState === 1) {
      const attempt = new Attempt({
        quizId: quiz._id,
        userId: req.user?._id || null, // Prepared for Phase 4 Auth
        answers: attemptAnswers,
        score,
        totalQuestions,
      });

      const savedAttempt = await attempt.save();
      attemptId = savedAttempt._id;
    }

    return res.status(200).json({
      success: true,
      message: 'Quiz submitted and graded successfully',
      data: {
        attemptId,
        quizId: quiz._id,
        score,
        totalQuestions,
        percentage,
        breakdown: gradedBreakdown,
      },
    });
  } catch (error) {
    console.error('Submit Quiz Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to grade quiz submission',
      details: error.message,
    });
  }
};

module.exports = {
  generateQuiz,
  getQuizById,
  submitQuiz,
};

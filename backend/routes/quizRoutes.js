const express = require('express');
const router = express.Router();
const { generateQuiz } = require('../controllers/quizController');

// POST /api/quiz/generate - Generate quiz questions via LLM
router.post('/generate', generateQuiz);

module.exports = router;

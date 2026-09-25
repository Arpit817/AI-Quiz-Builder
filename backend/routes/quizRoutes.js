const express = require('express');
const router = express.Router();
const {
  generateQuiz,
  getQuizById,
  submitQuiz,
} = require('../controllers/quizController');
const { optionalProtect } = require('../middleware/authMiddleware');

// Apply optional auth to all quiz routes:
// - Logged-in users get req.user populated (quizzes/attempts linked to their account)
// - Guests still work fine (req.user = null)
router.use(optionalProtect);

// POST /api/quiz/generate - Generate quiz questions via LLM
router.post('/generate', generateQuiz);

// GET /api/quiz/:id - Fetch quiz for taking (never exposes correctAnswerIndex)
router.get('/:id', getQuizById);

// POST /api/quiz/:id/submit - Submit answers for server-side grading
router.post('/:id/submit', submitQuiz);

module.exports = router;



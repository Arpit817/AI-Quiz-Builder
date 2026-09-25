const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register - Create a new account
router.post('/register', register);

// POST /api/auth/login - Log in and receive a JWT
router.post('/login', login);

// GET /api/auth/me - Get current user profile (protected)
router.get('/me', protect, getMe);

module.exports = router;

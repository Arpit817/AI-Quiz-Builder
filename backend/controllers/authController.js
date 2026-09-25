const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Signs a JWT for a given user ID.
 * Expires in 7 days by default.
 */
const signToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Sends a standardized auth response with token + user (no password).
 */
const sendAuthResponse = (res, statusCode, user, message) => {
  const token = signToken(user._id);

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    data: {
      _id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
};

// ─── Ensure MongoDB is connected ──────────────────────────────────────────────

const ensureConnected = async () => {
  if (mongoose.connection.readyState !== 1) {
    const connectDB = require('../config/db');
    await connectDB();
  }
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * Register a new user.
 *
 * Route: POST /api/auth/register
 * Body: { username, email, password }
 */
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Input validation
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Username must be at least 3 characters long.',
      });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    await ensureConnected();

    // Check for existing user with same email
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    return sendAuthResponse(res, 201, user, 'Account created successfully.');
  } catch (error) {
    console.error('Register Error:', error.message);

    // Handle Mongoose duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        error: messages.join(' '),
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.',
      details: error.message,
    });
  }
};

/**
 * Log in an existing user.
 *
 * Route: POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.',
      });
    }

    await ensureConnected();

    // Find user (explicitly select password since it's not selected by default in middleware)
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    return sendAuthResponse(res, 200, user, 'Logged in successfully.');
  } catch (error) {
    console.error('Login Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
      details: error.message,
    });
  }
};

/**
 * Get the currently authenticated user's profile.
 *
 * Route: GET /api/auth/me
 * Requires: Bearer token in Authorization header
 */
const getMe = async (req, res) => {
  // req.user is already attached and sanitized (no password) by authMiddleware
  return res.status(200).json({
    success: true,
    data: {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      createdAt: req.user.createdAt,
    },
  });
};

module.exports = {
  register,
  login,
  getMe,
};

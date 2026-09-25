const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 *
 * Verifies the JWT from the Authorization header (Bearer <token>).
 * On success, attaches the full user document to req.user.
 * On failure, returns 401 Unauthorized.
 *
 * Usage: apply to any route that requires a logged-in user.
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid token.',
      });
    }

    // 3. Fetch the user from DB (excludes password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User belonging to this token no longer exists.',
      });
    }

    // 4. Attach user to request for downstream controllers
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      details: error.message,
    });
  }
};

/**
 * Optional auth middleware — does NOT block unauthenticated requests.
 * Attaches req.user if a valid token is present, otherwise req.user = null.
 * Useful for routes that work for both guests and logged-in users.
 */
const optionalProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      req.user = user || null;
    } catch {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = { protect, optionalProtect };

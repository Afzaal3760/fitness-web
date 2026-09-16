const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const User = require('../models/user.model');

/**
 * JWT Authentication Middleware
 *
 * Verifies Bearer token in the Authorization header,
 * decodes the user ID, retrieves the safe user document from MongoDB,
 * and attaches it to `req.user`.
 *
 * Rejects missing, invalid, or expired tokens with status code 401.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check if Authorization header is provided and formatted as Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // 2. Extract token from header
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Malformed authorization header.',
      });
    }

    // 3. Verify JWT token with application secret key
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT.SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Authentication failed.',
      });
    }

    // 4. Find user by ID and exclude sensitive fields
    const user = await User.findById(decoded.id).select(
      '-password -resetPasswordToken -resetPasswordTokenExpiresAt -resetPasswordOtp -resetPasswordOtpExpiresAt -emailVerificationOtp -emailVerificationOtpExpiresAt'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account no longer exists.',
      });
    }

    // 5. Attach safe user data to req.user and proceed
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

/**
 * Role-based Authorization Middleware (Optional helper for protected admin/user routes)
 *
 * @param {...string} roles - Allowed roles (e.g., 'ADMIN', 'USER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. You do not have permission for this resource.',
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  protect: authenticate,
  verifyToken: authenticate,
  authorize,
  isAdmin: authorize('ADMIN'),
};

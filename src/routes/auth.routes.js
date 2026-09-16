const express = require('express');
const authController = require('../controllers/auth.controller');
const {
  validateSignup,
  validateLogin,
  validateVerifyOtp,
  validateForgotPassword,
  validateResetPassword,
} = require('../middleware/validation.middleware');

const router = express.Router();

/**
 * @route   POST /signup
 * @desc    Register a new user account and send verification OTP
 * @access  Public
 */
router.post('/signup', validateSignup, authController.signup);

/**
 * @route   POST /verify-otp
 * @desc    Verify OTP for email verification or password reset
 * @access  Public
 */
router.post('/verify-otp', validateVerifyOtp, authController.verifyOtp);

/**
 * @route   POST /login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   POST /admin-login
 * @desc    Authenticate admin user and get token
 * @access  Public
 */
router.post('/admin-login', validateLogin, authController.adminLogin);

/**
 * @route   POST /forgot-password
 * @desc    Request password reset OTP via email
 * @access  Public
 */
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);

/**
 * @route   POST /reset-password
 * @desc    Reset password using valid reset token
 * @access  Public
 */
router.post('/reset-password', validateResetPassword, authController.resetPassword);

module.exports = router;

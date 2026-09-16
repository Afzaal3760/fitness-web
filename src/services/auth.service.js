const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const User = require('../models/user.model');
const { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } = require('../templates/email.template');

/**
 * Register a new user account and send an email verification OTP.
 *
 * @param {Object} payload - User registration details
 * @param {string} payload.fullName - Full name of the user
 * @param {string} payload.email - User email address
 * @param {string} payload.password - Plain text password
 * @param {string} payload.confirmPassword - Plain text confirmation password
 * @returns {Promise<Object>} Created user data (excluding sensitive fields)
 */
const signup = async (payload) => {
  const { fullName, email, password, confirmPassword } = payload || {};

  // 1. Validate required fields
  if (!fullName || !email || !password || !confirmPassword) {
    const error = new Error('All fields are required: fullName, email, password, confirmPassword');
    error.statusCode = 400;
    throw error;
  }

  // 2. Check passwords match
  if (password !== confirmPassword) {
    const error = new Error('Passwords do not match');
    error.statusCode = 400;
    throw error;
  }

  // 3. Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // 4. Check duplicate email
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 400;
    throw error;
  }

  // 5. Hash password with bcryptjs
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 6. Generate secure 6-digit OTP using crypto
  const otp = crypto.randomInt(100000, 1000000).toString();

  // 7. Set OTP expiry to 10 minutes
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // 8. Create user with isVerified: false and save OTP details
  const newUser = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: 'USER',
    isVerified: false,
    emailVerificationOtp: otp,
    emailVerificationOtpExpiresAt: otpExpiresAt,
  });

  // 9. Send verification email using template
  await sendVerificationEmail(newUser.email, otp, newUser.fullName);

  // 10. Return safe user object (excluding password, confirmPassword, OTP)
  return {
    _id: newUser._id,
    fullName: newUser.fullName,
    email: newUser.email,
    role: newUser.role,
    isVerified: newUser.isVerified,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  };
};

/**
 * Verify OTP code for email verification or password reset.
 *
 * @param {Object|string} payload - Object with { email, otp, type } or email string
 * @param {string} [maybeOtp] - OTP code if passed positionally
 * @param {string} [maybeType] - Verification type if passed positionally
 * @returns {Promise<Object>} Verification result
 */
const verifyOtp = async (payload, maybeOtp, maybeType) => {
  let email, otp, type;
  if (typeof payload === 'object' && payload !== null) {
    ({ email, otp, type } = payload);
  } else {
    email = payload;
    otp = maybeOtp;
    type = maybeType;
  }

  // 1. Validate required fields
  if (!email || !otp || !type) {
    const error = new Error('All fields are required: email, otp, type');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate supported types
  const VALID_TYPES = ['EMAIL_VERIFICATION', 'RESET_PASSWORD'];
  if (!VALID_TYPES.includes(type)) {
    const error = new Error('Invalid verification type. Supported types: EMAIL_VERIFICATION, RESET_PASSWORD');
    error.statusCode = 400;
    throw error;
  }

  // 3. Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // 4. Find user by email
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // 5. Handle EMAIL_VERIFICATION
  if (type === 'EMAIL_VERIFICATION') {
    // Validate OTP presence and match
    if (!user.emailVerificationOtp || user.emailVerificationOtp !== String(otp).trim()) {
      const error = new Error('Invalid verification OTP');
      error.statusCode = 400;
      throw error;
    }

    // Validate 10-minute expiry
    if (!user.emailVerificationOtpExpiresAt || new Date() > new Date(user.emailVerificationOtpExpiresAt)) {
      const error = new Error('Verification OTP has expired');
      error.statusCode = 400;
      throw error;
    }

    // Set isVerified: true and clear verification OTP fields
    user.isVerified = true;
    user.emailVerificationOtp = null;
    user.emailVerificationOtpExpiresAt = null;
    await user.save();

    return {
      success: true,
      message: 'Email verified successfully',
      isVerified: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }

  // 6. Handle RESET_PASSWORD
  if (type === 'RESET_PASSWORD') {
    // Validate reset OTP presence and match
    if (!user.resetPasswordOtp || user.resetPasswordOtp !== String(otp).trim()) {
      const error = new Error('Invalid password reset OTP');
      error.statusCode = 400;
      throw error;
    }

    // Validate reset OTP expiry
    if (!user.resetPasswordOtpExpiresAt || new Date() > new Date(user.resetPasswordOtpExpiresAt)) {
      const error = new Error('Password reset OTP has expired');
      error.statusCode = 400;
      throw error;
    }

    // Generate secure random reset token (hex) and 1 hour expiry
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Save reset token details & clear reset OTP fields
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiresAt = resetTokenExpiresAt;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpiresAt = null;
    await user.save();

    return {
      success: true,
      message: 'Password reset OTP verified successfully',
      resetToken,
    };
  }
};

/**
 * Authenticate a user with email and password, returning a JWT and safe user profile.
 *
 * @param {Object|string} payload - Object with { email, password } or email string
 * @param {string} [maybePassword] - Plain text password if passed positionally
 * @returns {Promise<Object>} Object containing JWT access token and sanitized user profile
 */
const login = async (payload, maybePassword) => {
  let email, password;
  if (typeof payload === 'object' && payload !== null) {
    ({ email, password } = payload);
  } else {
    email = payload;
    password = maybePassword;
  }

  // 1. Validate required fields
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  // 2. Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // 3. Find user by email
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 4. Compare password using bcryptjs
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 5. Reject user if isVerified !== true
  if (user.isVerified !== true) {
    const error = new Error('Please verify your email address before logging in');
    error.statusCode = 403;
    throw error;
  }

  // 6. Generate JWT containing user id and role
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    env.JWT.SECRET,
    {
      expiresIn: env.JWT.EXPIRES_IN,
    }
  );

  // 7. Send welcome email upon successful login
  try {
    await sendWelcomeEmail(user.email, user.fullName);
  } catch (emailErr) {
    console.error('[Email] Failed to send welcome email:', emailErr.message);
  }

  // 8. Return token and safe user data (excluding password, OTPs, reset tokens)
  return {
    token,
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
};

/**
 * Authenticate an administrator with email and password, issuing a JWT access token.
 *
 * @param {Object|string} payload - Object with { email, password } or email string
 * @param {string} [maybePassword] - Plain text password if passed positionally
 * @returns {Promise<Object>} Object containing JWT token and sanitized admin profile
 */
const adminLogin = async (payload, maybePassword) => {
  let email, password;
  if (typeof payload === 'object' && payload !== null) {
    ({ email, password } = payload);
  } else {
    email = payload;
    password = maybePassword;
  }

  // 1. Validate required fields
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  // 2. Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // 3. Find user by email
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 4. Compare password using bcryptjs
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 5. Allow login only if user.role === 'ADMIN'
  if (user.role !== 'ADMIN') {
    const error = new Error('Access denied. Administrator privileges required.');
    error.statusCode = 403;
    throw error;
  }

  // 6. Generate JWT containing user id and role
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    env.JWT.SECRET,
    {
      expiresIn: env.JWT.EXPIRES_IN,
    }
  );

  // 7. Return token and safe admin data (excluding password, OTPs, reset tokens)
  return {
    token,
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
};

/**
 * Initiate a password reset flow by sending a 6-digit OTP if the account exists.
 *
 * @param {Object|string} payload - Object with { email } or email string
 * @returns {Promise<Object>} Generic success response to avoid email enumeration
 */
const forgotPassword = async (payload) => {
  let email;
  if (typeof payload === 'object' && payload !== null) {
    ({ email } = payload);
  } else {
    email = payload;
  }

  // 1. Validate required field
  if (!email) {
    const error = new Error('Email is required');
    error.statusCode = 400;
    throw error;
  }

  // 2. Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // 3. Find user by email
  const user = await User.findOne({ email: normalizedEmail });

  // 4. If user exists, generate OTP, set 10-minute expiry, save to document, and send email
  if (user) {
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiresAt = otpExpiresAt;
    await user.save();

    await sendPasswordResetEmail(user.email, otp, user.fullName);
  }

  // 5. Always return a generic success message to prevent user enumeration
  return {
    success: true,
    message: 'If an account with that email exists, a password reset code has been sent.',
  };
};

/**
 * Reset user password using a valid reset token.
 *
 * @param {Object|string} payload - Object with { resetToken, newPassword, confirmPassword } or resetToken string
 * @param {string} [maybeNewPassword] - New password if passed positionally
 * @param {string} [maybeConfirmPassword] - Confirmation password if passed positionally
 * @returns {Promise<Object>} Success message
 */
const resetPassword = async (payload, maybeNewPassword, maybeConfirmPassword) => {
  let resetToken, newPassword, confirmPassword;
  if (typeof payload === 'object' && payload !== null) {
    ({ resetToken, newPassword, confirmPassword } = payload);
  } else {
    resetToken = payload;
    newPassword = maybeNewPassword;
    confirmPassword = maybeConfirmPassword;
  }

  // 1. Validate all fields
  if (!resetToken || !newPassword || !confirmPassword) {
    const error = new Error('All fields are required: resetToken, newPassword, confirmPassword');
    error.statusCode = 400;
    throw error;
  }

  // 2. Check newPassword === confirmPassword
  if (newPassword !== confirmPassword) {
    const error = new Error('Passwords do not match');
    error.statusCode = 400;
    throw error;
  }

  // 3. Find user with matching reset token
  const user = await User.findOne({ resetPasswordToken: resetToken });
  if (!user) {
    const error = new Error('Invalid or expired password reset token');
    error.statusCode = 400;
    throw error;
  }

  // 4. Check reset token expiry
  if (!user.resetPasswordTokenExpiresAt || new Date() > new Date(user.resetPasswordTokenExpiresAt)) {
    const error = new Error('Password reset token has expired');
    error.statusCode = 400;
    throw error;
  }

  // 5. Hash new password with bcryptjs
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // 6. Update password and clear reset token & OTP fields
  user.password = hashedPassword;
  user.resetPasswordToken = null;
  user.resetPasswordTokenExpiresAt = null;
  user.resetPasswordOtp = null;
  user.resetPasswordOtpExpiresAt = null;
  await user.save();

  // 7. Return success message
  return {
    success: true,
    message: 'Password has been reset successfully. You can now log in with your new password.',
  };
};

module.exports = {
  signup,
  verifyOtp,
  login,
  adminLogin,
  forgotPassword,
  resetPassword,
};






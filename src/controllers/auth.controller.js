const authService = require('../services/auth.service');

/**
 * Handle user registration
 */
const signup = async (req, res, next) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;
    const result = await authService.signup({
      fullName,
      email,
      password,
      confirmPassword,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Verification code has been sent to your email.',
      user: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle OTP verification (email verification or password reset verification)
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, type } = req.body;
    const result = await authService.verifyOtp({
      email,
      otp,
      type,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle regular user authentication
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({
      email,
      password,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle administrator authentication
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.adminLogin({
      email,
      password,
    });

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle forgot password request
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword({
      email,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle password reset with token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;
    const result = await authService.resetPassword({
      resetToken,
      newPassword,
      confirmPassword,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  verifyOtp,
  login,
  adminLogin,
  forgotPassword,
  resetPassword,
};

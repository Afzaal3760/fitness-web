/**
 * Auth Request Validation Middleware
 *
 * Pure validation layer — runs before controllers/services.
 * Returns 400 with clear error messages for invalid input.
 * Does NOT touch auth logic, JWT, email, or database.
 */

// ─── Regex Patterns ──────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[a-zA-Z\s]+$/;
const OTP_REGEX = /^\d{6}$/;
const PASSWORD_UPPER = /[A-Z]/;
const PASSWORD_LOWER = /[a-z]/;
const PASSWORD_DIGIT = /[0-9]/;
const PASSWORD_SPECIAL = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Collect all validation errors and return a 400 response if any exist.
 * @param {Array<string>} errors
 * @param {Object} res
 * @param {Function} next
 */
const sendErrors = (errors, res, next) => {
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }
  next();
};

/**
 * Validate email format and return trimmed, lowercase value.
 * Pushes error messages into the provided array.
 */
const validateEmail = (email, errors) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required.');
    return '';
  }
  const cleaned = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(cleaned)) {
    errors.push('Please provide a valid email address.');
  }
  return cleaned;
};

/**
 * Validate strong password requirements.
 * Pushes error messages into the provided array.
 */
const validateStrongPassword = (password, fieldName, errors) => {
  if (!password || typeof password !== 'string') {
    errors.push(`${fieldName} is required.`);
    return;
  }
  if (password.length < 8) {
    errors.push(`${fieldName} must be at least 8 characters long.`);
  }
  if (!PASSWORD_UPPER.test(password)) {
    errors.push(`${fieldName} must contain at least one uppercase letter.`);
  }
  if (!PASSWORD_LOWER.test(password)) {
    errors.push(`${fieldName} must contain at least one lowercase letter.`);
  }
  if (!PASSWORD_DIGIT.test(password)) {
    errors.push(`${fieldName} must contain at least one number.`);
  }
  if (!PASSWORD_SPECIAL.test(password)) {
    errors.push(`${fieldName} must contain at least one special character.`);
  }
};

// ─── Route Validators ────────────────────────────────────────────

/**
 * POST /signup
 * Validates: fullName, email, password, confirmPassword
 */
const validateSignup = (req, res, next) => {
  const errors = [];
  const { fullName, email, password, confirmPassword } = req.body || {};

  // fullName
  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    errors.push('Full name is required.');
  } else {
    const trimmed = fullName.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      errors.push('Full name must be between 2 and 50 characters.');
    }
    if (!NAME_REGEX.test(trimmed)) {
      errors.push('Full name must contain only letters and spaces.');
    }
  }

  // email
  validateEmail(email, errors);

  // password (strong)
  validateStrongPassword(password, 'Password', errors);

  // confirmPassword
  if (!confirmPassword || typeof confirmPassword !== 'string') {
    errors.push('Confirm password is required.');
  } else if (password && password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  sendErrors(errors, res, next);
};

/**
 * POST /login and POST /admin-login
 * Validates: email (format), password (presence)
 */
const validateLogin = (req, res, next) => {
  const errors = [];
  const { email, password } = req.body || {};

  validateEmail(email, errors);

  if (!password || typeof password !== 'string' || !password.trim()) {
    errors.push('Password is required.');
  }

  sendErrors(errors, res, next);
};

/**
 * POST /verify-otp
 * Validates: email, otp (6 digits), type
 */
const validateVerifyOtp = (req, res, next) => {
  const errors = [];
  const { email, otp, type } = req.body || {};

  validateEmail(email, errors);

  // otp — must be exactly 6 numeric digits
  const otpStr = otp != null ? String(otp).trim() : '';
  if (!otpStr) {
    errors.push('OTP is required.');
  } else if (!OTP_REGEX.test(otpStr)) {
    errors.push('OTP must be exactly 6 numeric digits.');
  }

  // type
  if (!type || typeof type !== 'string' || !type.trim()) {
    errors.push('Verification type is required.');
  }

  sendErrors(errors, res, next);
};

/**
 * POST /forgot-password
 * Validates: email
 */
const validateForgotPassword = (req, res, next) => {
  const errors = [];
  const { email } = req.body || {};

  validateEmail(email, errors);

  sendErrors(errors, res, next);
};

/**
 * POST /reset-password
 * Validates: resetToken, newPassword (strong), confirmPassword
 */
const validateResetPassword = (req, res, next) => {
  const errors = [];
  const { resetToken, newPassword, confirmPassword } = req.body || {};

  // resetToken
  if (!resetToken || typeof resetToken !== 'string' || !resetToken.trim()) {
    errors.push('Reset token is required.');
  }

  // newPassword (strong)
  validateStrongPassword(newPassword, 'New password', errors);

  // confirmPassword
  if (!confirmPassword || typeof confirmPassword !== 'string') {
    errors.push('Confirm password is required.');
  } else if (newPassword && newPassword !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  sendErrors(errors, res, next);
};

module.exports = {
  validateSignup,
  validateLogin,
  validateVerifyOtp,
  validateForgotPassword,
  validateResetPassword,
};

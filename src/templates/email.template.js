const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const env = require('../../config/env');

/**
 * Transporter configuration using application environment variables
 */
const transporter = nodemailer.createTransport({
  host: env.SMTP.HOST,
  port: env.SMTP.PORT,
  secure: env.SMTP.SECURE,
  auth: {
    user: env.SMTP.USER,
    pass: env.SMTP.PASS,
  },
});

const LOGO_PATH = path.join(__dirname, '../../public/images/estrella-logo.png');
const TEMPLATES_DIR = path.join(__dirname, 'emails');

/**
 * Format a 6-digit OTP string with a center space for readability.
 * e.g. "382104" → "382 104"
 *
 * @param {string|number} otp
 * @returns {string}
 */
const formatOtp = (otp) => {
  if (!otp) return '';
  const str = String(otp).replace(/\s/g, '');
  if (str.length === 6) {
    return `${str.slice(0, 3)} ${str.slice(3)}`;
  }
  return str;
};

// Register Handlebars helpers
handlebars.registerHelper('formatOtp', (otp) => formatOtp(otp));
handlebars.registerHelper('year', () => new Date().getFullYear());

/**
 * In-memory cache for compiled Handlebars templates
 */
const templateCache = new Map();

/**
 * Load and compile a Handlebars template from the templates/emails directory.
 *
 * @param {string} templateName - Template file name without extension (e.g., 'welcome')
 * @returns {Function} Compiled Handlebars template function
 */
const getCompiledTemplate = (templateName) => {
  if (templateCache.has(templateName) && !env.isDevelopment) {
    return templateCache.get(templateName);
  }

  const filePath = path.join(TEMPLATES_DIR, `${templateName}.hbs`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Email template not found: ${filePath}`);
  }

  const source = fs.readFileSync(filePath, 'utf-8');
  const compiled = handlebars.compile(source);
  templateCache.set(templateName, compiled);
  return compiled;
};

/**
 * Render an email template with context data.
 *
 * @param {string} templateName - Template name (e.g. 'welcome', 'signup-verification', 'forgot-password')
 * @param {Object} context - Data context for Handlebars
 * @returns {string} Compiled HTML string
 */
const renderTemplate = (templateName, context = {}) => {
  const template = getCompiledTemplate(templateName);
  const data = {
    currentYear: new Date().getFullYear(),
    ...context,
  };
  return template(data);
};

/**
 * Helper to build standard logo attachment
 */
const getLogoAttachment = () => {
  if (fs.existsSync(LOGO_PATH)) {
    return [
      {
        filename: 'estrella-logo.png',
        path: LOGO_PATH,
        cid: 'estrella-logo',
      },
    ];
  }
  return [];
};

/**
 * Send Welcome Email to user upon successful login.
 *
 * @param {string} email - Recipient email address
 * @param {string} fullName - Full name of the user
 * @param {Object} [options] - Additional optional settings
 * @param {string} [options.dashboardUrl] - Custom dashboard URL
 * @returns {Promise<Object>} Nodemailer send result
 */
const sendWelcomeEmail = async (email, fullName, options = {}) => {
  const htmlContent = renderTemplate('welcome', {
    fullName: fullName || 'Athlete',
    dashboardUrl: options.dashboardUrl || 'https://estrellaperformance.com/dashboard',
  });

  const mailOptions = {
    from: env.SMTP.FROM,
    to: email,
    subject: 'Welcome to Estrella Kinetic Performance!',
    html: htmlContent,
    attachments: getLogoAttachment(),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send Signup Verification OTP email.
 *
 * @param {string} email - Recipient email address
 * @param {string|number} otp - 6-digit verification code
 * @param {string} [fullName] - Optional full name of the user
 * @returns {Promise<Object>} Nodemailer send result
 */
const sendVerificationEmail = async (email, otp, fullName = '') => {
  const formattedOtp = formatOtp(otp);
  const htmlContent = renderTemplate('signup-verification', {
    fullName: fullName || '',
    otp,
    formattedOtp,
  });

  const mailOptions = {
    from: env.SMTP.FROM,
    to: email,
    subject: `${formattedOtp} is your Kinetic Performance verification code`,
    html: htmlContent,
    attachments: getLogoAttachment(),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send Password Reset OTP email.
 *
 * @param {string} email - Recipient email address
 * @param {string|number} otp - 6-digit reset code
 * @param {string} [fullName] - Optional full name of the user
 * @returns {Promise<Object>} Nodemailer send result
 */
const sendPasswordResetEmail = async (email, otp, fullName = '') => {
  const formattedOtp = formatOtp(otp);
  const htmlContent = renderTemplate('forgot-password', {
    fullName: fullName || '',
    otp,
    formattedOtp,
  });

  const mailOptions = {
    from: env.SMTP.FROM,
    to: email,
    subject: `${formattedOtp} is your Kinetic Performance password reset code`,
    html: htmlContent,
    attachments: getLogoAttachment(),
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  renderTemplate,
  formatOtp,
  transporter,
};

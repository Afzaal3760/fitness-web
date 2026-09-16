const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,

  // Database
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitness_web',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173',

  // JWT Configuration
  JWT: {
    SECRET: process.env.JWT_SECRET || 'fitness_web_jwt_secret_dev_key',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fitness_web_jwt_refresh_dev_key',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Email / SMTP Configuration
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    SECURE: process.env.SMTP_SECURE === 'true',
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM: process.env.EMAIL_FROM || (process.env.EMAIL_FROM_ADDRESS ? `"${process.env.EMAIL_FROM_NAME || 'Estrella'}" <${process.env.EMAIL_FROM_ADDRESS}>` : (process.env.SMTP_USER ? `"Estrella" <${process.env.SMTP_USER}>` : 'Estrella <no-reply@fitnessapp.com>')),
  },

  // Admin Credentials (for seed setup)
  ADMIN: {
    EMAIL: process.env.ADMIN_EMAIL || '',
    PASSWORD: process.env.ADMIN_PASSWORD || '',
  },
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',

  // Environment Helpers
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Validate required variables in production
if (env.isProduction) {
  const requiredVars = ['MONGO_URI', 'JWT_SECRET'];
  const missing = requiredVars.filter((varName) => !process.env[varName]);
  if (missing.length > 0) {
    console.error(`[FATAL] Missing required environment variables in production: ${missing.join(', ')}`);
    process.exit(1);
  }
}

module.exports = env;

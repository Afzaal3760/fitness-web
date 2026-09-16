const env = require('../../config/env');

/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);

  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
    ...(env.isDevelopment && { stack: err.stack }),
  };

  if (env.isDevelopment) {
    console.error(`[Error] ${req.method} ${req.originalUrl} - ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

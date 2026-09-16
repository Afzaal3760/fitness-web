const app = require('./app');
const env = require('../config/env');
const connectDB = require('../config/db');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Fatal] Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// Connect to Database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`💪 Fitness Web API running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`Health check available at: http://localhost:${env.PORT}/api/health`);
    });

    // Graceful Shutdown handlers
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        try {
          const mongoose = require('mongoose');
          await mongoose.connection.close(false);
          console.log('[Database] MongoDB connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('[Error] Error closing MongoDB connection:', err.message);
          process.exit(1);
        }
      });

      // Force shutdown after 10s timeout
      setTimeout(() => {
        console.error('[Server] Forcing shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[Fatal] Unhandled Rejection at:', promise, 'reason:', reason);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    console.error('[Fatal] Error during server startup:', error.message);
    process.exit(1);
  }
};

startServer();

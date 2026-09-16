const express = require('express');
const cors = require('cors');
const corsOptions = require('../config/cors');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Security & Parsing Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);

// Health Check & Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Fitness Web API',
    version: '1.0.0',
    status: 'online',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;

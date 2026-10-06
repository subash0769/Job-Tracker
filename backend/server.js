require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { connectWithRetry, closeClient } = require('./src/config/db');
const applicationRoutes = require('./src/routes/applicationRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const { notFoundHandler, globalErrorHandler } = require('./src/middleware/errorHandler');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = '0.0.0.0';

// Configure CORS
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: allowedOrigin === '*' ? '*' : allowedOrigin.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Built-in JSON request body parser
app.use(express.json());

// Request logging to stdout (container friendly)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Serve frontend static assets (pure vanilla JS/HTML/CSS, zero build step)
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/applications', applicationRoutes);

// Fallback to frontend index.html for SPA / root GET requests
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Catch-all 404 & error handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

let server;

/**
 * Graceful shutdown handler for SIGINT and SIGTERM
 */
async function handleShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(() => {
      console.log('[Server] HTTP server closed.');
    });
  }

  try {
    await closeClient();
    console.log('[Server] Graceful shutdown completed.');
    process.exit(0);
  } catch (err) {
    console.error('[Server] Error during database disconnect:', err.message);
    process.exit(1);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

/**
 * Initialize application:
 * 1. Verify and retry MongoDB connectivity
 * 2. Start HTTP server listening on 0.0.0.0:PORT
 */
async function startServer() {
  console.log('[Server] Starting Job Application Tracker backend service (Node.js + MongoDB)...');
  console.log(`[Config] PORT=${PORT}, HOST=${HOST}, CORS_ORIGIN=${allowedOrigin}`);

  // Retry database connection on startup before serving requests
  await connectWithRetry(20, 3000);

  server = app.listen(PORT, HOST, () => {
    console.log(`[Server] Job Application Tracker is running on http://${HOST}:${PORT}`);
    console.log(`[Server] Web UI: http://localhost:${PORT}`);
    console.log(`[Server] REST API: http://localhost:${PORT}/api/applications`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

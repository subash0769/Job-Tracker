/**
 * 404 Handler for undefined API routes
 */
function notFoundHandler(req, res, next) {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      message: `Resource not found: ${req.method} ${req.originalUrl}`,
    });
  }
  next();
}

/**
 * Global 500 Error Handler
 */
function globalErrorHandler(err, req, res, next) {
  console.error('[Error]', err);

  const statusCode = err.status || err.statusCode || 500;
  const response = {
    message: err.message || 'Internal Server Error',
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};

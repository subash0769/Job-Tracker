const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');

// GET /api/health - verifies MongoDB connectivity, returns 503 if DB is down
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    await db.command({ ping: 1 });

    return res.status(200).json({
      status: 'ok',
      service: 'job-tracker-backend',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (err) {
    const errorMsg = err.message || err.code || 'Database connection failed';
    console.error('[HealthCheck] MongoDB ping failed:', errorMsg);
    return res.status(503).json({
      status: 'error',
      service: 'job-tracker-backend',
      message: 'Database service unavailable',
      error: errorMsg,
    });
  }
});

module.exports = router;

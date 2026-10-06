const express = require('express');
const router = express.Router();
const {
  getAllApplications,
  getApplicationStats,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
} = require('../controllers/applicationController');

// GET /api/applications/stats - summary stats for dashboard counters
router.get('/stats', getApplicationStats);

// GET /api/applications - list all with search and filter
router.get('/', getAllApplications);

// GET /api/applications/:id - get single application
router.get('/:id', getApplicationById);

// POST /api/applications - create new application
router.post('/', createApplication);

// PUT /api/applications/:id - update existing application
router.put('/:id', updateApplication);

// DELETE /api/applications/:id - delete application
router.delete('/:id', deleteApplication);

module.exports = router;

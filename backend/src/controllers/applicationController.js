const { ObjectId } = require('mongodb');
const { getApplicationsCollection } = require('../config/db');
const { validateApplicationInput } = require('../utils/validation');

function formatApplication(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    company: doc.company,
    position: doc.position,
    status: doc.status || 'Applied',
    location: doc.location || null,
    salary: doc.salary || null,
    appliedDate: doc.appliedDate || null,
    jobUrl: doc.jobUrl || null,
    notes: doc.notes || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * GET /api/applications
 * Returns list of applications with optional search and status filtering
 */
async function getAllApplications(req, res, next) {
  try {
    const collection = getApplicationsCollection();
    const searchQuery = req.query.search ? req.query.search.trim() : null;
    const statusFilter = req.query.status ? req.query.status.trim() : null;
    const sortBy = req.query.sort || 'newest';

    const filter = {};

    if (searchQuery) {
      const safeQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { company: { $regex: safeQuery, $options: 'i' } },
        { position: { $regex: safeQuery, $options: 'i' } },
        { location: { $regex: safeQuery, $options: 'i' } },
      ];
    }

    if (statusFilter && statusFilter !== 'All') {
      filter.status = statusFilter;
    }

    let sortOptions = { createdAt: -1, _id: -1 };
    if (sortBy === 'applied_desc') {
      sortOptions = { appliedDate: -1, createdAt: -1 };
    } else if (sortBy === 'applied_asc') {
      sortOptions = { appliedDate: 1, createdAt: 1 };
    } else if (sortBy === 'company_asc') {
      sortOptions = { company: 1, createdAt: -1 };
    }

    const items = await collection
      .find(filter)
      .sort(sortOptions)
      .toArray();

    return res.status(200).json(items.map(formatApplication));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/applications/stats
 * Returns summary counts for dashboard metrics
 */
async function getApplicationStats(req, res, next) {
  try {
    const collection = getApplicationsCollection();

    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ];

    const results = await collection.aggregate(pipeline).toArray();

    const stats = {
      total: 0,
      applied: 0,
      interviewing: 0,
      offered: 0,
      rejected: 0,
      withdrawn: 0,
    };

    results.forEach((item) => {
      const statusKey = (item._id || '').toLowerCase();
      if (stats[statusKey] !== undefined) {
        stats[statusKey] = item.count;
      }
      stats.total += item.count;
    });

    return res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/applications/:id
 * Returns a single application by ID
 */
async function getApplicationById(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid application ID format' });
    }

    const collection = getApplicationsCollection();
    const doc = await collection.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return res.status(404).json({ message: 'Application not found' });
    }

    return res.status(200).json(formatApplication(doc));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/applications
 * Creates a new job application
 */
async function createApplication(req, res, next) {
  try {
    const validation = validateApplicationInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        message: validation.errors[0],
        errors: validation.errors,
      });
    }

    const now = new Date();
    const newDoc = {
      ...validation.sanitized,
      createdAt: now,
      updatedAt: now,
    };

    const collection = getApplicationsCollection();
    const result = await collection.insertOne(newDoc);

    const createdDoc = await collection.findOne({ _id: result.insertedId });
    return res.status(201).json(formatApplication(createdDoc));
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/applications/:id
 * Updates an existing job application
 */
async function updateApplication(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid application ID format' });
    }

    const validation = validateApplicationInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        message: validation.errors[0],
        errors: validation.errors,
      });
    }

    const collection = getApplicationsCollection();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...validation.sanitized,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    const updatedDoc = result.value || result;
    if (!updatedDoc || !updatedDoc._id) {
      return res.status(404).json({ message: 'Application not found' });
    }

    return res.status(200).json(formatApplication(updatedDoc));
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/applications/:id
 * Deletes an existing job application
 */
async function deleteApplication(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid application ID format' });
    }

    const collection = getApplicationsCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    return res.status(200).json({
      message: 'Application deleted successfully',
      id,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllApplications,
  getApplicationStats,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
};

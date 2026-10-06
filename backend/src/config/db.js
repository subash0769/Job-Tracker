const { MongoClient } = require('mongodb');

function buildMongoUri() {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  const host = process.env.MONGO_HOST || 'localhost';
  const port = process.env.MONGO_PORT || 27017;
  const dbName = process.env.MONGO_DB || 'job_tracker';
  const user = process.env.MONGO_USER;
  const password = process.env.MONGO_PASSWORD;

  if (user && password) {
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(password);
    return `mongodb://${encodedUser}:${encodedPassword}@${host}:${port}/${dbName}?authSource=admin`;
  }

  return `mongodb://${host}:${port}/${dbName}`;
}

const mongoUri = buildMongoUri();
const dbName = process.env.MONGO_DB || 'job_tracker';

// Initialize MongoClient
const client = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: 2500,
  connectTimeoutMS: 5000,
});

let dbInstance = null;

/**
 * Retries connecting to MongoDB every intervalMs up to maxAttempts.
 * Essential for container environments where database may take 10-30s to boot.
 */
async function connectWithRetry(maxAttempts = 20, intervalMs = 3000) {
  // Sanitize URI for logging (hide credentials if present)
  const sanitizedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[DB] Attempting MongoDB connection (${attempt}/${maxAttempts}) to ${sanitizedUri}...`);
      await client.connect();
      dbInstance = client.db(dbName);

      // Verify connectivity with a ping command
      await dbInstance.command({ ping: 1 });

      console.log(`[DB] Successfully connected to MongoDB database '${dbInstance.databaseName}'`);
      return dbInstance;
    } catch (err) {
      const errorDetail =
        err.message ||
        err.code ||
        (Array.isArray(err.errors) && err.errors.map((e) => e.message || e.code).join(', ')) ||
        String(err);

      console.error(`[DB] Attempt ${attempt}/${maxAttempts} failed: ${errorDetail}`);

      if (attempt < maxAttempts) {
        console.log(`[DB] Retrying in ${intervalMs / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      } else {
        console.error(`[DB] FATAL: Could not connect to MongoDB after ${maxAttempts} attempts. Exiting.`);
        process.exit(1);
      }
    }
  }
}

function getDb() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call connectWithRetry() first.');
  }
  return dbInstance;
}

function getApplicationsCollection() {
  return getDb().collection('applications');
}

/**
 * Closes the MongoDB client connection gracefully.
 */
async function closeClient() {
  try {
    await client.close();
    console.log('[DB] MongoDB client connection closed.');
  } catch (err) {
    console.error('[DB] Error closing MongoDB connection:', err.message);
  }
}

module.exports = {
  client,
  connectWithRetry,
  getDb,
  getApplicationsCollection,
  closeClient,
};

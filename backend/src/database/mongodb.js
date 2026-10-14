const { MongoClient } = require('mongodb');
const config = require('../config');
const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger.util');

let client;
let db;

async function connect() {
  client = new MongoClient(config.db.url);
  await client.connect();
  db = client.db(config.db.name);
  logger.info(`Connected to MongoDB: ${config.db.name}`);

  await createIndexes();
}

async function createIndexes() {
  const { COLLECTIONS } = CONSTANTS;

  try {
    await db.collection(COLLECTIONS.USERS).createIndex({ email: 1 }, { unique: true });

    await db.collection(COLLECTIONS.SESSIONS).createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );
    await db.collection(COLLECTIONS.SESSIONS).createIndex({ userId: 1 });

    await db.collection(COLLECTIONS.ORGANIZATIONS).createIndex({ slug: 1 }, { unique: true });

    await db.collection(COLLECTIONS.ORGANIZATION_MEMBERS).createIndex(
      { organizationId: 1, userId: 1 },
      { unique: true }
    );

    await db.collection(COLLECTIONS.PROJECTS).createIndex(
      { organizationId: 1, slug: 1 },
      { unique: true }
    );

    await db.collection(COLLECTIONS.API_KEYS).createIndex({ projectId: 1 });
    await db.collection(COLLECTIONS.API_KEYS).createIndex({ keyHash: 1 }, { unique: true });

    await db.collection(COLLECTIONS.MANAGED_COLLECTIONS).createIndex(
      { projectId: 1, name: 1 },
      { unique: true }
    );

    await db.collection(COLLECTIONS.MANAGED_DOCUMENTS).createIndex({
      projectId: 1,
      managedCollectionId: 1,
    });

    await db.collection(COLLECTIONS.FILES).createIndex({ s3Key: 1 }, { unique: true });
    await db.collection(COLLECTIONS.FILES).createIndex({ projectId: 1, folderPath: 1 });

    await db.collection(COLLECTIONS.JOBS).createIndex({ projectId: 1, status: 1 });

    logger.info('MongoDB indexes created successfully');
  } catch (error) {
    logger.error({ err: error }, 'Failed to create MongoDB indexes');
    throw error;
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not connected. Call connect() first.');
  }
  return db;
}

async function close() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info('MongoDB connection closed');
  }
}

module.exports = {
  connect,
  getDb,
  close,
};

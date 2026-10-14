const { getDb } = require('../database/mongodb');
const { toObjectId } = require('../utils/objectId.util');
const CONSTANTS = require('../config/constants');

function collection() {
  return getDb().collection(CONSTANTS.COLLECTIONS.JOBS);
}

async function create(jobData) {
  const now = new Date();
  return collection().insertOne({
    projectId: toObjectId(jobData.projectId),
    type: jobData.type,
    payload: jobData.payload || {},
    status: CONSTANTS.JOB_STATUS.PENDING,
    attempts: 0,
    maxAttempts: jobData.maxAttempts || CONSTANTS.JOB.MAX_ATTEMPTS,
    lastError: null,
    scheduledFor: jobData.scheduledFor ? new Date(jobData.scheduledFor) : null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

async function findById(id) {
  return collection().findOne({ _id: toObjectId(id) });
}

async function findByProjectId(projectId, status = null, skip = 0, limit = 20) {
  const query = { projectId: toObjectId(projectId) };
  if (status) query.status = status;

  const [jobs, total] = await Promise.all([
    collection().find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    collection().countDocuments(query),
  ]);

  return { jobs, total };
}

async function updateStatus(id, status, extraFields = {}) {
  return collection().updateOne(
    { _id: toObjectId(id) },
    { $set: { status, ...extraFields, updatedAt: new Date() } }
  );
}

module.exports = {
  create,
  findById,
  findByProjectId,
  updateStatus,
};

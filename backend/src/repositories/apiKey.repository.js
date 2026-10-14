const { getDb } = require('../database/mongodb');
const { toObjectId } = require('../utils/objectId.util');
const CONSTANTS = require('../config/constants');

function collection() {
  return getDb().collection(CONSTANTS.COLLECTIONS.API_KEYS);
}

async function create(keyData) {
  const now = new Date();
  return collection().insertOne({
    projectId: toObjectId(keyData.projectId),
    environment: keyData.environment,
    keyPrefix: keyData.keyPrefix,
    keyHash: keyData.keyHash,
    name: keyData.name,
    scopes: keyData.scopes,
    lastUsedAt: null,
    revokedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

async function findById(id) {
  return collection().findOne({ _id: toObjectId(id) });
}

async function findByProjectId(projectId) {
  return collection()
    .find({ projectId: toObjectId(projectId) })
    .project({ keyHash: 0 })
    .toArray();
}

async function findActiveByHash(keyHash) {
  return collection().findOne({ keyHash, revokedAt: null });
}

async function revoke(id) {
  const now = new Date();
  return collection().updateOne(
    { _id: toObjectId(id) },
    { $set: { revokedAt: now, updatedAt: now } }
  );
}

async function deleteById(id) {
  return collection().deleteOne({ _id: toObjectId(id) });
}

async function updateLastUsed(id) {
  return collection().updateOne(
    { _id: toObjectId(id) },
    { $set: { lastUsedAt: new Date() } }
  );
}

module.exports = {
  create,
  findById,
  findByProjectId,
  findActiveByHash,
  revoke,
  deleteById,
  updateLastUsed,
};

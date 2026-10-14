const { getDb } = require('../database/mongodb');
const { toObjectId } = require('../utils/objectId.util');
const CONSTANTS = require('../config/constants');

function collection() {
  return getDb().collection(CONSTANTS.COLLECTIONS.SESSIONS);
}

async function create(sessionData) {
  return collection().insertOne({
    userId: toObjectId(sessionData.userId),
    refreshTokenHash: sessionData.refreshTokenHash,
    userAgent: sessionData.userAgent || 'unknown',
    ipAddress: sessionData.ipAddress || 'unknown',
    expiresAt: sessionData.expiresAt,
    revokedAt: null,
    createdAt: new Date(),
  });
}

async function findById(id) {
  return collection().findOne({ _id: toObjectId(id) });
}

async function updateRefreshTokenHash(id, refreshTokenHash) {
  return collection().updateOne(
    { _id: toObjectId(id) },
    { $set: { refreshTokenHash } }
  );
}

async function revoke(id) {
  return collection().updateOne(
    { _id: toObjectId(id) },
    { $set: { revokedAt: new Date() } }
  );
}

async function revokeAllForUser(userId) {
  return collection().updateMany(
    { userId: toObjectId(userId), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

module.exports = {
  create,
  findById,
  updateRefreshTokenHash,
  revoke,
  revokeAllForUser,
};

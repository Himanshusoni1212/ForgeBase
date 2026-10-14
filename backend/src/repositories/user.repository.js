const { getDb } = require('../database/mongodb');
const { toObjectId } = require('../utils/objectId.util');
const CONSTANTS = require('../config/constants');

function collection() {
  return getDb().collection(CONSTANTS.COLLECTIONS.USERS);
}

async function create(userData) {
  const now = new Date();
  return collection().insertOne({
    ...userData,
    emailVerified: false,
    oauthIdentities: [],
    status: CONSTANTS.USER_STATUS.ACTIVE,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

async function findByEmail(email) {
  return collection().findOne({ email });
}

async function findById(id) {
  return collection().findOne({ _id: toObjectId(id) });
}

async function updateById(id, updateData) {
  return collection().updateOne(
    { _id: toObjectId(id) },
    { $set: { ...updateData, updatedAt: new Date() } }
  );
}

async function updateLastLogin(id) {
  const now = new Date();
  return collection().updateOne(
    { _id: toObjectId(id) },
    { $set: { lastLoginAt: now, updatedAt: now } }
  );
}

module.exports = {
  create,
  findByEmail,
  findById,
  updateById,
  updateLastLogin,
};

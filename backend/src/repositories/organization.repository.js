const { getDb } = require('../database/mongodb');
const { toObjectId } = require('../utils/objectId.util');
const CONSTANTS = require('../config/constants');

function collection() {
  return getDb().collection(CONSTANTS.COLLECTIONS.ORGANIZATIONS);
}

async function create(orgData) {
  const now = new Date();
  return collection().insertOne({
    name: orgData.name,
    slug: orgData.slug,
    ownerId: toObjectId(orgData.ownerId),
    plan: orgData.plan || 'free',
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

async function findById(id) {
  return collection().findOne({ _id: toObjectId(id), deletedAt: null });
}

async function findBySlug(slug) {
  return collection().findOne({ slug, deletedAt: null });
}

async function findByIds(ids) {
  return collection()
    .find({ _id: { $in: ids.map(toObjectId) }, deletedAt: null })
    .toArray();
}

async function updateById(id, updateData) {
  return collection().updateOne(
    { _id: toObjectId(id) },
    { $set: { ...updateData, updatedAt: new Date() } }
  );
}

async function softDelete(id) {
  const now = new Date();
  return collection().updateOne(
    { _id: toObjectId(id) },
    { $set: { deletedAt: now, updatedAt: now } }
  );
}

module.exports = {
  create,
  findById,
  findBySlug,
  findByIds,
  updateById,
  softDelete,
};

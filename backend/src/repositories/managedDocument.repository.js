const { getDb } = require('../database/mongodb');
const { toObjectId } = require('../utils/objectId.util');
const CONSTANTS = require('../config/constants');

function collection() {
  return getDb().collection(CONSTANTS.COLLECTIONS.MANAGED_DOCUMENTS);
}

async function create(docData) {
  const now = new Date();
  return collection().insertOne({
    projectId: toObjectId(docData.projectId),
    managedCollectionId: toObjectId(docData.managedCollectionId),
    data: docData.data,
    createdAt: now,
    updatedAt: now,
  });
}

async function findById(id, managedCollectionId) {
  return collection().findOne({
    _id: toObjectId(id),
    managedCollectionId: toObjectId(managedCollectionId),
  });
}

async function find({ managedCollectionId, filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 } }) {
  const query = { managedCollectionId: toObjectId(managedCollectionId) };

  for (const [key, value] of Object.entries(filter)) {
    query[`data.${key}`] = value;
  }

  const [docs, total] = await Promise.all([
    collection().find(query).sort(sort).skip(skip).limit(limit).toArray(),
    collection().countDocuments(query),
  ]);

  return { docs, total };
}

async function updateById(id, managedCollectionId, data) {
  return collection().updateOne(
    {
      _id: toObjectId(id),
      managedCollectionId: toObjectId(managedCollectionId),
    },
    { $set: { data, updatedAt: new Date() } }
  );
}

async function deleteById(id, managedCollectionId) {
  return collection().deleteOne({
    _id: toObjectId(id),
    managedCollectionId: toObjectId(managedCollectionId),
  });
}

async function deleteByCollectionId(managedCollectionId) {
  return collection().deleteMany({
    managedCollectionId: toObjectId(managedCollectionId),
  });
}

async function aggregate(managedCollectionId, pipeline) {
  const scopedPipeline = [
    { $match: { managedCollectionId: toObjectId(managedCollectionId) } },
    ...pipeline,
  ];

  return collection().aggregate(scopedPipeline).toArray();
}

module.exports = {
  create,
  findById,
  find,
  updateById,
  deleteById,
  deleteByCollectionId,
  aggregate,
};

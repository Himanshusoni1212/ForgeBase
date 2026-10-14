const { getDb } = require('../database/mongodb');
const { toObjectId } = require('../utils/objectId.util');
const CONSTANTS = require('../config/constants');

function collection() {
  return getDb().collection(CONSTANTS.COLLECTIONS.MANAGED_COLLECTIONS);
}

async function create(collectionData) {
  const now = new Date();
  return collection().insertOne({
    projectId: toObjectId(collectionData.projectId),
    name: collectionData.name,
    schemaRules: collectionData.schemaRules || {},
    createdAt: now,
    updatedAt: now,
  });
}

async function findById(id) {
  return collection().findOne({ _id: toObjectId(id) });
}

async function findByProjectAndName(projectId, name) {
  return collection().findOne({
    projectId: toObjectId(projectId),
    name,
  });
}

async function findByProjectId(projectId) {
  return collection()
    .find({ projectId: toObjectId(projectId) })
    .toArray();
}

async function deleteById(id) {
  return collection().deleteOne({ _id: toObjectId(id) });
}

module.exports = {
  create,
  findById,
  findByProjectAndName,
  findByProjectId,
  deleteById,
};

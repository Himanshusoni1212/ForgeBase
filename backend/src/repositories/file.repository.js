const { getDb } = require('../database/mongodb');
const { toObjectId } = require('../utils/objectId.util');
const CONSTANTS = require('../config/constants');

function collection() {
  return getDb().collection(CONSTANTS.COLLECTIONS.FILES);
}

async function create(fileData) {
  const now = new Date();
  return collection().insertOne({
    projectId: toObjectId(fileData.projectId),
    folderPath: fileData.folderPath || '/',
    originalName: fileData.originalName,
    s3Key: fileData.s3Key,
    mimeType: fileData.mimeType,
    sizeBytes: fileData.sizeBytes,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

async function findById(id) {
  return collection().findOne({ _id: toObjectId(id), deletedAt: null });
}

async function findByProjectId(projectId, folderPath = null) {
  const query = {
    projectId: toObjectId(projectId),
    deletedAt: null,
  };

  if (folderPath) {
    query.folderPath = folderPath;
  }

  return collection().find(query).sort({ createdAt: -1 }).toArray();
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
  findByProjectId,
  softDelete,
};

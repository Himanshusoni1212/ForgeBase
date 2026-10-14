const managedCollectionRepository = require('../repositories/managedCollection.repository');
const managedDocumentRepository = require('../repositories/managedDocument.repository');
const channels = require('../realtime/channels');
const { AppError } = require('../utils/appError.util');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger.util');

async function resolveCollection(projectId, collectionName) {
  const managedCollection = await managedCollectionRepository.findByProjectAndName(
    projectId,
    collectionName
  );

  if (!managedCollection) {
    throw new AppError(
      `Collection '${collectionName}' not found`,
      404,
      ERROR_CODES.COLLECTION_NOT_FOUND
    );
  }

  return managedCollection;
}

async function createCollection({ projectId, name, schemaRules }) {
  const existing = await managedCollectionRepository.findByProjectAndName(projectId, name);

  if (existing) {
    throw new AppError(
      'Collection already exists',
      409,
      ERROR_CODES.COLLECTION_ALREADY_EXISTS
    );
  }

  const result = await managedCollectionRepository.create({ projectId, name, schemaRules });

  logger.info({ projectId, collectionName: name }, 'Managed collection created');

  return managedCollectionRepository.findById(result.insertedId);
}

async function listCollections(projectId) {
  return managedCollectionRepository.findByProjectId(projectId);
}

async function deleteCollection({ projectId, collectionName }) {
  const managedCollection = await resolveCollection(projectId, collectionName);

  const deleted = await managedDocumentRepository.deleteByCollectionId(managedCollection._id);
  await managedCollectionRepository.deleteById(managedCollection._id);

  logger.info(
    { projectId, collectionName, deletedDocuments: deleted.deletedCount },
    'Managed collection deleted'
  );

  return { deletedDocuments: deleted.deletedCount };
}

async function createDocument({ projectId, collectionName, data }) {
  const managedCollection = await resolveCollection(projectId, collectionName);

  const result = await managedDocumentRepository.create({
    projectId,
    managedCollectionId: managedCollection._id.toString(),
    data,
  });

  const doc = await managedDocumentRepository.findById(result.insertedId, managedCollection._id);

  channels.broadcast(projectId.toString(), collectionName, 'document:created', doc);

  return doc;
}

async function listDocuments({ projectId, collectionName, page, limit, sort, order, filter }) {
  const managedCollection = await resolveCollection(projectId, collectionName);

  const sortField = sort === 'createdAt' || sort === 'updatedAt' ? sort : `data.${sort}`;
  const sortObject = sort
    ? { [sortField]: order === 'asc' ? 1 : -1 }
    : { createdAt: -1 };

  const { docs, total } = await managedDocumentRepository.find({
    managedCollectionId: managedCollection._id,
    filter: filter || {},
    skip: (page - 1) * limit,
    limit,
    sort: sortObject,
  });

  return {
    documents: docs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

async function getDocument({ projectId, collectionName, docId }) {
  const managedCollection = await resolveCollection(projectId, collectionName);

  const doc = await managedDocumentRepository.findById(docId, managedCollection._id);

  if (!doc) {
    throw new AppError('Document not found', 404, ERROR_CODES.DOCUMENT_NOT_FOUND);
  }

  return doc;
}

async function updateDocument({ projectId, collectionName, docId, data }) {
  const managedCollection = await resolveCollection(projectId, collectionName);
  const existing = await getDocument({ projectId, collectionName, docId });

  const mergedData = { ...existing.data, ...data };
  await managedDocumentRepository.updateById(docId, managedCollection._id, mergedData);

  const updated = await managedDocumentRepository.findById(docId, managedCollection._id);

  channels.broadcast(projectId.toString(), collectionName, 'document:updated', updated);

  return updated;
}

async function deleteDocument({ projectId, collectionName, docId }) {
  const managedCollection = await resolveCollection(projectId, collectionName);
  await getDocument({ projectId, collectionName, docId });

  await managedDocumentRepository.deleteById(docId, managedCollection._id);

  channels.broadcast(projectId.toString(), collectionName, 'document:deleted', { _id: docId });
}

async function runAggregation({ projectId, collectionName, pipeline }) {
  const managedCollection = await resolveCollection(projectId, collectionName);
  return managedDocumentRepository.aggregate(managedCollection._id, pipeline);
}

module.exports = {
  createCollection,
  listCollections,
  deleteCollection,
  createDocument,
  listDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  runAggregation,
};

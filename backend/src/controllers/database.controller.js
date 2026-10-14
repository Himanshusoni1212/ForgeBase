const databaseService = require('../services/database.service');
const apiResponse = require('../utils/apiResponse.util');

function projectId(req) {
  return req.project._id.toString();
}

async function createCollection(req, res, next) {
  try {
    const managedCollection = await databaseService.createCollection({
      projectId: projectId(req),
      name: req.body.name,
      schemaRules: req.body.schemaRules,
    });

    return apiResponse.success(res, managedCollection, 'Collection created', 201);
  } catch (error) {
    next(error);
  }
}

async function listCollections(req, res, next) {
  try {
    const collections = await databaseService.listCollections(projectId(req));
    return apiResponse.success(res, collections);
  } catch (error) {
    next(error);
  }
}

async function deleteCollection(req, res, next) {
  try {
    const result = await databaseService.deleteCollection({
      projectId: projectId(req),
      collectionName: req.params.name,
    });

    return apiResponse.success(res, result, 'Collection deleted');
  } catch (error) {
    next(error);
  }
}

async function createDocument(req, res, next) {
  try {
    const doc = await databaseService.createDocument({
      projectId: projectId(req),
      collectionName: req.params.name,
      data: req.body.data,
    });

    return apiResponse.success(res, doc, 'Document created', 201);
  } catch (error) {
    next(error);
  }
}

async function listDocuments(req, res, next) {
  try {
    const result = await databaseService.listDocuments({
      projectId: projectId(req),
      collectionName: req.params.name,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
      order: req.query.order,
      filter: req.query.filter,
    });

    return apiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function getDocument(req, res, next) {
  try {
    const doc = await databaseService.getDocument({
      projectId: projectId(req),
      collectionName: req.params.name,
      docId: req.params.docId,
    });

    return apiResponse.success(res, doc);
  } catch (error) {
    next(error);
  }
}

async function updateDocument(req, res, next) {
  try {
    const doc = await databaseService.updateDocument({
      projectId: projectId(req),
      collectionName: req.params.name,
      docId: req.params.docId,
      data: req.body.data,
    });

    return apiResponse.success(res, doc, 'Document updated');
  } catch (error) {
    next(error);
  }
}

async function deleteDocument(req, res, next) {
  try {
    await databaseService.deleteDocument({
      projectId: projectId(req),
      collectionName: req.params.name,
      docId: req.params.docId,
    });

    return apiResponse.success(res, null, 'Document deleted');
  } catch (error) {
    next(error);
  }
}

async function aggregate(req, res, next) {
  try {
    const results = await databaseService.runAggregation({
      projectId: projectId(req),
      collectionName: req.params.name,
      pipeline: req.body.pipeline,
    });

    return apiResponse.success(res, results);
  } catch (error) {
    next(error);
  }
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
  aggregate,
};

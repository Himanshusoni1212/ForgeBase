const apiKeyService = require('../services/apiKey.service');
const apiResponse = require('../utils/apiResponse.util');

const CREATED_MESSAGE = 'API key created. Save the raw key — it will not be shown again.';

async function create(req, res, next) {
  try {
    const key = await apiKeyService.createApiKey({
      projectId: req.params.projectId,
      name: req.body.name,
      environment: req.body.environment,
      scopes: req.body.scopes,
    });

    return apiResponse.success(res, key, CREATED_MESSAGE, 201);
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const keys = await apiKeyService.listApiKeys(req.params.projectId);
    return apiResponse.success(res, keys);
  } catch (error) {
    next(error);
  }
}

async function revoke(req, res, next) {
  try {
    await apiKeyService.revokeApiKey(req.params.keyId, req.params.projectId);
    return apiResponse.success(res, null, 'API key revoked');
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await apiKeyService.deleteApiKey(req.params.keyId, req.params.projectId);
    return apiResponse.success(res, null, 'API key deleted');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  list,
  revoke,
  remove,
};

const crypto = require('crypto');
const apiKeyRepository = require('../repositories/apiKey.repository');
const projectRepository = require('../repositories/project.repository');
const hashUtil = require('../utils/hash.util');
const { AppError } = require('../utils/appError.util');
const ERROR_CODES = require('../constants/errorCodes');
const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger.util');

async function createApiKey({ projectId, name, environment, scopes }) {
  const randomPart = crypto.randomBytes(CONSTANTS.API_KEY.BYTE_LENGTH).toString('hex');
  const rawKey = `${CONSTANTS.API_KEY.PREFIX}${randomPart}`;
  const keyPrefix = rawKey.substring(
    0,
    CONSTANTS.API_KEY.PREFIX.length + CONSTANTS.API_KEY.DISPLAY_PREFIX_LENGTH
  );

  const result = await apiKeyRepository.create({
    projectId,
    environment,
    keyPrefix,
    keyHash: hashUtil.sha256(rawKey),
    name,
    scopes,
  });

  logger.info({ projectId, keyId: result.insertedId, name }, 'API key created');

  return {
    _id: result.insertedId,
    projectId,
    environment,
    keyPrefix,
    name,
    scopes,
    rawKey,
    createdAt: new Date(),
  };
}

async function verifyRawKey(rawKey) {
  const apiKey = await apiKeyRepository.findActiveByHash(hashUtil.sha256(rawKey));

  if (!apiKey) {
    throw new AppError('Invalid API key', 401, ERROR_CODES.API_KEY_INVALID);
  }

  const project = await projectRepository.findById(apiKey.projectId);

  if (!project) {
    throw new AppError('Project not found or deleted', 404, ERROR_CODES.PROJECT_NOT_FOUND);
  }

  apiKeyRepository
    .updateLastUsed(apiKey._id)
    .catch((error) => logger.error({ err: error }, 'Failed to update API key lastUsedAt'));

  return {
    apiKey: {
      _id: apiKey._id,
      projectId: apiKey.projectId,
      environment: apiKey.environment,
      scopes: apiKey.scopes,
      name: apiKey.name,
    },
    project,
  };
}

async function listApiKeys(projectId) {
  return apiKeyRepository.findByProjectId(projectId);
}

async function findOwnedKey(keyId, projectId) {
  const key = await apiKeyRepository.findById(keyId);

  if (!key) {
    throw new AppError('API key not found', 404, ERROR_CODES.API_KEY_NOT_FOUND);
  }

  if (key.projectId.toString() !== projectId) {
    throw new AppError(
      'API key does not belong to this project',
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  return key;
}

async function revokeApiKey(keyId, projectId) {
  const key = await findOwnedKey(keyId, projectId);

  if (key.revokedAt) {
    throw new AppError('API key is already revoked', 400, ERROR_CODES.API_KEY_REVOKED);
  }

  await apiKeyRepository.revoke(keyId);
  logger.info({ keyId, projectId }, 'API key revoked');
}

async function deleteApiKey(keyId, projectId) {
  await findOwnedKey(keyId, projectId);
  await apiKeyRepository.deleteById(keyId);
  logger.info({ keyId, projectId }, 'API key deleted');
}

module.exports = {
  createApiKey,
  verifyRawKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey,
};

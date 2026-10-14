const apiKeyService = require('../services/apiKey.service');
const ERROR_CODES = require('../constants/errorCodes');
const { AppError } = require('../utils/appError.util');

async function authenticateApiKey(req, res, next) {
  try {
    const rawKey = req.headers['x-api-key'];

    if (!rawKey) {
      throw new AppError('API key required', 401, ERROR_CODES.API_KEY_INVALID);
    }

    const { apiKey, project } = await apiKeyService.verifyRawKey(rawKey);

    if (req.params.projectId && req.params.projectId !== project._id.toString()) {
      throw new AppError(
        'API key does not belong to this project',
        403,
        ERROR_CODES.API_KEY_PROJECT_MISMATCH
      );
    }

    req.project = project;
    req.apiKey = apiKey;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authenticateApiKey;

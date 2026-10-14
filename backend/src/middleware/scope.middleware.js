const ERROR_CODES = require('../constants/errorCodes');
const { AppError } = require('../utils/appError.util');

function requireScope(requiredScope) {
  return (req, res, next) => {
    const scopes = (req.apiKey && req.apiKey.scopes) || [];

    if (!scopes.includes(requiredScope)) {
      return next(
        new AppError(
          `API key is missing the required scope: ${requiredScope}`,
          403,
          ERROR_CODES.API_KEY_INSUFFICIENT_SCOPE
        )
      );
    }

    next();
  };
}

module.exports = { requireScope };

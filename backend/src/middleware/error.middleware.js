const logger = require('../utils/logger.util');
const apiResponse = require('../utils/apiResponse.util');
const ERROR_CODES = require('../constants/errorCodes');

function errorMiddleware(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || ERROR_CODES.INTERNAL_ERROR;

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = ERROR_CODES.AUTH_INVALID_TOKEN;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
    code = ERROR_CODES.AUTH_TOKEN_EXPIRED;
  } else if (err.name === 'SyntaxError' && err.status === 400) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    code = ERROR_CODES.VALIDATION_ERROR;
  } else if (err.code === 11000 || err.codeName === 'DuplicateKey') {
    statusCode = 409;
    message = 'Resource already exists';
    code = ERROR_CODES.DUPLICATE_KEY;
  }

  const requestContext = { method: req.method, url: req.originalUrl };

  if (statusCode >= 500) {
    logger.error({ err, req: requestContext }, message);
  } else {
    logger.warn({ err: { message: err.message, code }, req: requestContext }, message);
  }

  return apiResponse.error(res, message, code, statusCode);
}

module.exports = errorMiddleware;

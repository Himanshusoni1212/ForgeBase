const apiResponse = require('../utils/apiResponse.util');
const ERROR_CODES = require('../constants/errorCodes');

function notFound(req, res) {
  return apiResponse.error(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    ERROR_CODES.NOT_FOUND,
    404
  );
}

module.exports = notFound;

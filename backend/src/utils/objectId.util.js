const { ObjectId } = require('mongodb');
const { AppError } = require('./appError.util');
const ERROR_CODES = require('../constants/errorCodes');

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

function toObjectId(value) {
  if (value instanceof ObjectId) {
    return value;
  }

  if (typeof value === 'string' && OBJECT_ID_PATTERN.test(value)) {
    return new ObjectId(value);
  }

  throw new AppError('Invalid id format', 400, ERROR_CODES.VALIDATION_ERROR);
}

module.exports = { toObjectId };

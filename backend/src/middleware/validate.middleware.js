const apiResponse = require('../utils/apiResponse.util');
const ERROR_CODES = require('../constants/errorCodes');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return apiResponse.error(
        res,
        'Validation failed',
        ERROR_CODES.VALIDATION_ERROR,
        400,
        { errors }
      );
    }

    Object.defineProperty(req, source, {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    next();
  };
}

module.exports = validate;

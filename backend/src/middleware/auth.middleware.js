const jwtUtil = require('../utils/jwt.util');
const ERROR_CODES = require('../constants/errorCodes');
const { AppError } = require('../utils/appError.util');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401, ERROR_CODES.AUTH_MISSING_TOKEN);
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('Authentication required', 401, ERROR_CODES.AUTH_MISSING_TOKEN);
  }

  try {
    req.user = jwtUtil.verifyAccessToken(token);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token has expired', 401, ERROR_CODES.AUTH_TOKEN_EXPIRED);
    }
    throw new AppError('Invalid token', 401, ERROR_CODES.AUTH_INVALID_TOKEN);
  }
}

module.exports = authenticate;

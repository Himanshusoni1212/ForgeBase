const { RateLimiterMemory } = require('rate-limiter-flexible');
const CONSTANTS = require('../config/constants');
const apiResponse = require('../utils/apiResponse.util');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger.util');

let authLimiter;
let generalLimiter;

function initRateLimiters() {
  authLimiter = new RateLimiterMemory({
    keyPrefix: 'rl:auth',
    points: CONSTANTS.RATE_LIMIT.AUTH_MAX_REQUESTS,
    duration: CONSTANTS.RATE_LIMIT.AUTH_WINDOW_SECONDS,
    blockDuration: CONSTANTS.RATE_LIMIT.AUTH_BLOCK_SECONDS,
  });

  generalLimiter = new RateLimiterMemory({
    keyPrefix: 'rl:general',
    points: CONSTANTS.RATE_LIMIT.GENERAL_MAX_REQUESTS,
    duration: CONSTANTS.RATE_LIMIT.GENERAL_WINDOW_SECONDS,
  });
}

async function consume(limiter, fallbackSeconds, req, res, next) {
  if (!limiter) {
    logger.warn('Rate limiter not initialized, skipping');
    return next();
  }

  try {
    await limiter.consume(req.ip);
    next();
  } catch (rejection) {
    const retryAfter = Math.ceil(rejection.msBeforeNext / 1000) || fallbackSeconds;
    res.set('Retry-After', String(retryAfter));
    apiResponse.error(
      res,
      'Too many requests. Please try again later.',
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      429
    );
  }
}

function authRateLimiter(req, res, next) {
  return consume(authLimiter, CONSTANTS.RATE_LIMIT.AUTH_WINDOW_SECONDS, req, res, next);
}

function generalRateLimiter(req, res, next) {
  return consume(generalLimiter, CONSTANTS.RATE_LIMIT.GENERAL_WINDOW_SECONDS, req, res, next);
}

module.exports = {
  initRateLimiters,
  authRateLimiter,
  generalRateLimiter,
};

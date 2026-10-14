const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const hashUtil = require('../utils/hash.util');
const jwtUtil = require('../utils/jwt.util');
const config = require('../config');
const { AppError } = require('../utils/appError.util');
const ERROR_CODES = require('../constants/errorCodes');
const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger.util');

const EXPIRY_UNIT_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const DEFAULT_REFRESH_EXPIRY_MS = 7 * EXPIRY_UNIT_MS.d;

function parseExpiry(expiry) {
  const match = /^(\d+)([smhd])$/.exec(expiry);

  if (!match) {
    return DEFAULT_REFRESH_EXPIRY_MS;
  }

  return parseInt(match[1], 10) * EXPIRY_UNIT_MS[match[2]];
}

async function createSession({ userId, email, name, userAgent, ipAddress }) {
  const expiresAt = new Date(Date.now() + parseExpiry(config.jwt.refreshExpiry));

  const sessionResult = await sessionRepository.create({
    userId,
    refreshTokenHash: null,
    userAgent,
    ipAddress,
    expiresAt,
  });

  const sessionId = sessionResult.insertedId.toString();

  const accessToken = jwtUtil.signAccessToken({ userId, email, name, sessionId });
  const refreshToken = jwtUtil.signRefreshToken({ userId, sessionId });

  const refreshTokenHash = await hashUtil.hash(refreshToken);
  await sessionRepository.updateRefreshTokenHash(sessionId, refreshTokenHash);

  return { accessToken, refreshToken };
}

async function register({ email, password, name, userAgent, ipAddress }) {
  const existing = await userRepository.findByEmail(email);

  if (existing) {
    throw new AppError(
      'User with this email already exists',
      409,
      ERROR_CODES.USER_ALREADY_EXISTS
    );
  }

  const passwordHash = await hashUtil.hash(password);
  const result = await userRepository.create({ email, passwordHash, name });
  const userId = result.insertedId.toString();

  const { accessToken, refreshToken } = await createSession({
    userId,
    email,
    name,
    userAgent,
    ipAddress,
  });

  logger.info({ userId, email }, 'User registered');

  return {
    user: { _id: userId, email, name },
    accessToken,
    refreshToken,
  };
}

async function login({ email, password, userAgent, ipAddress }) {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new AppError(
      'Invalid email or password',
      401,
      ERROR_CODES.AUTH_INVALID_CREDENTIALS
    );
  }

  if (user.status === CONSTANTS.USER_STATUS.SUSPENDED) {
    throw new AppError('Account has been suspended', 403, ERROR_CODES.AUTH_USER_SUSPENDED);
  }

  const isValid = await hashUtil.compare(password, user.passwordHash);

  if (!isValid) {
    throw new AppError(
      'Invalid email or password',
      401,
      ERROR_CODES.AUTH_INVALID_CREDENTIALS
    );
  }

  await userRepository.updateLastLogin(user._id);

  const { accessToken, refreshToken } = await createSession({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    userAgent,
    ipAddress,
  });

  logger.info({ userId: user._id, email }, 'User logged in');

  return {
    user: {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  };
}

async function refresh({ refreshToken, userAgent, ipAddress }) {
  let decoded;

  try {
    decoded = jwtUtil.verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError('Invalid refresh token', 401, ERROR_CODES.AUTH_REFRESH_FAILED);
  }

  const session = await sessionRepository.findById(decoded.sessionId);

  if (!session) {
    throw new AppError('Session not found', 401, ERROR_CODES.AUTH_REFRESH_FAILED);
  }

  if (session.revokedAt) {
    logger.warn(
      { userId: session.userId },
      'Refresh token reuse detected, revoking all sessions'
    );
    await sessionRepository.revokeAllForUser(session.userId);
    throw new AppError('Session has been revoked', 401, ERROR_CODES.AUTH_SESSION_REVOKED);
  }

  const isValid = await hashUtil.compare(refreshToken, session.refreshTokenHash);

  if (!isValid) {
    throw new AppError('Invalid refresh token', 401, ERROR_CODES.AUTH_REFRESH_FAILED);
  }

  await sessionRepository.revoke(session._id);

  const user = await userRepository.findById(session.userId);

  if (!user) {
    throw new AppError('User not found', 401, ERROR_CODES.AUTH_REFRESH_FAILED);
  }

  return createSession({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    userAgent,
    ipAddress,
  });
}

async function logout(userId, sessionId) {
  if (!sessionId) {
    return;
  }

  await sessionRepository.revoke(sessionId);
  logger.info({ userId, sessionId }, 'User logged out');
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};

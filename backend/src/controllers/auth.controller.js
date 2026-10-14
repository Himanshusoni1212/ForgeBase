const authService = require('../services/auth.service');
const apiResponse = require('../utils/apiResponse.util');

function requestContext(req) {
  return {
    userAgent: req.get('user-agent') || 'unknown',
    ipAddress: req.ip,
  };
}

async function register(req, res, next) {
  try {
    const result = await authService.register({
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
      ...requestContext(req),
    });

    return apiResponse.success(res, result, 'Registration successful', 201);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
      ...requestContext(req),
    });

    return apiResponse.success(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refresh({
      refreshToken: req.body.refreshToken,
      ...requestContext(req),
    });

    return apiResponse.success(res, result, 'Token refreshed');
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user.userId, req.user.sessionId);
    return apiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};

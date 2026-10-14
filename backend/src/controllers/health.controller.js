const { getDb } = require('../database/mongodb');
const apiResponse = require('../utils/apiResponse.util');
const logger = require('../utils/logger.util');

async function getHealth(req, res) {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'unknown',
    },
  };

  try {
    await getDb().command({ ping: 1 });
    health.services.mongodb = 'connected';
  } catch (error) {
    health.services.mongodb = 'disconnected';
    health.status = 'degraded';
    logger.error({ err: error }, 'Health check: MongoDB down');
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  return apiResponse.success(res, health, undefined, statusCode);
}

module.exports = {
  getHealth,
};

const logger = require('../utils/logger.util');

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${Date.now() - start}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 400) {
      logger.warn(logData, 'Request completed');
    } else {
      logger.info(logData, 'Request completed');
    }
  });

  next();
}

module.exports = requestLogger;

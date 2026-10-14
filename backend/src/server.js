const http = require('http');
const config = require('./config');
const logger = require('./utils/logger.util');
const app = require('./app');
const mongodb = require('./database/mongodb');
const { initRateLimiters } = require('./middleware/rateLimiter.middleware');
const { initQueue } = require('./jobs/queue');
const { initWorker, closeWorker } = require('./jobs/worker');
const { initSocketServer } = require('./realtime/socketServer');

const SHUTDOWN_TIMEOUT_MS = 15000;

async function startServer() {
  await mongodb.connect();

  initRateLimiters();
  initQueue();
  initWorker();

  const server = http.createServer(app);
  initSocketServer(server);

  server.listen(config.port, () => {
    logger.info(
      { port: config.port, env: config.nodeEnv, app: config.appName },
      `${config.appName} server running on port ${config.port}`
    );
  });

  return server;
}

function registerShutdownHandlers(server) {
  const shutdown = (signal) => {
    logger.info({ signal }, 'Shutdown signal received');

    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        await closeWorker();
      } catch (error) {
        logger.error({ err: error }, 'Error closing worker');
      }

      try {
        await mongodb.close();
      } catch (error) {
        logger.error({ err: error }, 'Error closing MongoDB');
      }

      logger.info('All connections closed. Exiting.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled Rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'Uncaught Exception');
    process.exit(1);
  });
}

startServer()
  .then(registerShutdownHandlers)
  .catch((error) => {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  });

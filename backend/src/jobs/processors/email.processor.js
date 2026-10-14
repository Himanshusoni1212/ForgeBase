const notificationService = require('../../services/notification.service');
const logger = require('../../utils/logger.util');

async function process(job) {
  const { to, subject, body, template } = job.data.payload || {};

  logger.info({ jobId: job.id, to, subject }, 'Processing email job');

  return notificationService.sendEmail({ to, subject, body, template });
}

module.exports = { process };

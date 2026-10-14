const jobRepository = require('../repositories/job.repository');
const notificationService = require('../services/notification.service');
const emailProcessor = require('./processors/email.processor');
const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger.util');

const processors = {
  email: emailProcessor.process,
  webhook: async (job) => {
    const { url, payload } = job.data.payload || {};
    return notificationService.sendWebhook({ url, payload });
  },
  cleanup: async (job) => {
    logger.info({ jobId: job.id }, 'Processing cleanup job');
    return { cleaned: true };
  },
};

function initWorker() {
  logger.info('In-memory worker initialized');
}

async function processJob(job) {
  const { type, projectId, jobRecordId } = job.data;
  const attempt = job.attemptsMade + 1;

  logger.info({ jobId: job.id, type, projectId, attempt }, 'Processing job');

  try {
    if (jobRecordId) {
      await jobRepository.updateStatus(jobRecordId, CONSTANTS.JOB_STATUS.PROCESSING, {
        attempts: attempt,
      });
    }

    const processor = processors[type];

    if (!processor) {
      throw new Error(`Unknown job type: ${type}`);
    }

    await processor(job);

    if (jobRecordId) {
      await jobRepository.updateStatus(jobRecordId, CONSTANTS.JOB_STATUS.COMPLETED, {
        completedAt: new Date(),
      });
    }

    logger.info({ jobId: job.id, type }, 'Job completed successfully');
    return true;
  } catch (error) {
    logger.error({ jobId: job.id, type, attempt, err: error }, 'Job failed');

    if (jobRecordId) {
      const isFinalAttempt = attempt >= job.maxAttempts;

      await jobRepository.updateStatus(
        jobRecordId,
        isFinalAttempt ? CONSTANTS.JOB_STATUS.DEAD : CONSTANTS.JOB_STATUS.FAILED,
        { lastError: error.message, attempts: attempt }
      );
    }

    return false;
  }
}

async function closeWorker() {
  logger.info('In-memory worker closed');
}

module.exports = {
  initWorker,
  processJob,
  closeWorker,
};

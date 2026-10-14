const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger.util');

class InMemoryQueue {
  constructor(name) {
    this.name = name;
    this.jobCounter = 0;
  }

  async add(type, data, options = {}) {
    this.jobCounter += 1;

    const job = {
      id: `${type}-${this.jobCounter}`,
      type,
      data,
      attemptsMade: 0,
      maxAttempts: options.attempts || CONSTANTS.JOB.MAX_ATTEMPTS,
      backoffDelayMs: options.backoffDelayMs || CONSTANTS.JOB.BACKOFF_DELAY_MS,
    };

    this.schedule(job, options.delay || CONSTANTS.JOB.ENQUEUE_DELAY_MS);
  }

  schedule(job, delayMs) {
    setTimeout(async () => {
      try {
        const { processJob } = require('./worker');
        const succeeded = await processJob(job);

        if (succeeded) {
          return;
        }

        const nextAttempt = job.attemptsMade + 1;

        if (nextAttempt >= job.maxAttempts) {
          return;
        }

        const backoffMs = job.backoffDelayMs * 2 ** job.attemptsMade;
        this.schedule({ ...job, attemptsMade: nextAttempt }, backoffMs);
      } catch (error) {
        logger.error({ err: error, jobId: job.id, type: job.type }, 'Error running job');
      }
    }, delayMs);
  }
}

let jobQueue;

function initQueue() {
  jobQueue = new InMemoryQueue('forgebase-jobs');
  logger.info('In-memory job queue initialized');
  return jobQueue;
}

function getQueue() {
  if (!jobQueue) {
    throw new Error('Job queue not initialized. Call initQueue() first.');
  }
  return jobQueue;
}

module.exports = {
  initQueue,
  getQueue,
};

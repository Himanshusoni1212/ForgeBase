const jobRepository = require('../repositories/job.repository');
const { getQueue } = require('../jobs/queue');
const { AppError } = require('../utils/appError.util');
const ERROR_CODES = require('../constants/errorCodes');
const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger.util');

async function enqueueJob({ projectId, type, payload, scheduledFor, maxAttempts }) {
  const result = await jobRepository.create({
    projectId,
    type,
    payload,
    scheduledFor,
    maxAttempts,
  });

  const jobRecordId = result.insertedId.toString();

  try {
    const options = {
      attempts: maxAttempts || CONSTANTS.JOB.MAX_ATTEMPTS,
      backoffDelayMs: CONSTANTS.JOB.BACKOFF_DELAY_MS,
    };

    if (scheduledFor) {
      const delay = new Date(scheduledFor).getTime() - Date.now();
      if (delay > 0) options.delay = delay;
    }

    await getQueue().add(type, { type, projectId, payload, jobRecordId }, options);

    logger.info({ projectId, jobRecordId, type }, 'Job enqueued');
  } catch (error) {
    await jobRepository.updateStatus(jobRecordId, CONSTANTS.JOB_STATUS.FAILED, {
      lastError: error.message,
    });
    logger.error({ err: error, projectId, type }, 'Failed to enqueue job');
    throw new AppError('Failed to enqueue job', 500, ERROR_CODES.JOB_ENQUEUE_FAILED);
  }

  return jobRepository.findById(jobRecordId);
}

async function getJob(jobId, projectId) {
  const job = await jobRepository.findById(jobId);

  if (!job) {
    throw new AppError('Job not found', 404, ERROR_CODES.JOB_NOT_FOUND);
  }

  if (job.projectId.toString() !== projectId) {
    throw new AppError(
      'Job does not belong to this project',
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  return job;
}

async function listJobs({ projectId, status, page, limit }) {
  const { jobs, total } = await jobRepository.findByProjectId(
    projectId,
    status,
    (page - 1) * limit,
    limit
  );

  return {
    jobs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

module.exports = {
  enqueueJob,
  getJob,
  listJobs,
};

const jobService = require('../services/job.service');
const apiResponse = require('../utils/apiResponse.util');

async function create(req, res, next) {
  try {
    const job = await jobService.enqueueJob({
      projectId: req.project._id.toString(),
      type: req.body.type,
      payload: req.body.payload,
      scheduledFor: req.body.scheduledFor,
      maxAttempts: req.body.maxAttempts,
    });

    return apiResponse.success(res, job, 'Job enqueued', 201);
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const result = await jobService.listJobs({
      projectId: req.project._id.toString(),
      status: req.query.status || null,
      page: req.query.page,
      limit: req.query.limit,
    });

    return apiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const job = await jobService.getJob(req.params.jobId, req.project._id.toString());
    return apiResponse.success(res, job);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  list,
  getById,
};

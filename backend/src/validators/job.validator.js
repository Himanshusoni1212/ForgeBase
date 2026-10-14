const { z } = require('zod');
const CONSTANTS = require('../config/constants');

const createJobSchema = z.object({
  type: z.enum(CONSTANTS.JOB_TYPES, {
    required_error: 'Job type is required',
    invalid_type_error: `Job type must be one of: ${CONSTANTS.JOB_TYPES.join(', ')}`,
  }),
  payload: z.object({}).passthrough().optional().default({}),
  scheduledFor: z.coerce.date().optional(),
  maxAttempts: z.coerce.number().int().min(1).max(10).optional(),
});

const listJobsSchema = z.object({
  status: z.enum(Object.values(CONSTANTS.JOB_STATUS)).optional(),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(CONSTANTS.PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(CONSTANTS.PAGINATION.MAX_LIMIT)
    .optional()
    .default(CONSTANTS.PAGINATION.DEFAULT_LIMIT),
});

module.exports = {
  createJobSchema,
  listJobsSchema,
};

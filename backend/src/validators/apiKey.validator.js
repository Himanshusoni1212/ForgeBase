const { z } = require('zod');
const CONSTANTS = require('../config/constants');

const createApiKeySchema = z.object({
  name: z
    .string({ required_error: 'API key name is required' })
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  environment: z.enum(CONSTANTS.ENVIRONMENTS).optional().default('development'),
  scopes: z
    .array(z.enum(CONSTANTS.API_KEY.SCOPES))
    .nonempty('At least one scope is required')
    .optional()
    .default(CONSTANTS.API_KEY.SCOPES),
});

module.exports = {
  createApiKeySchema,
};

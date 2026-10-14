const { z } = require('zod');
const CONSTANTS = require('../config/constants');

const ALLOWED_AGGREGATION_OPERATORS = [
  '$match',
  '$group',
  '$sort',
  '$limit',
  '$skip',
  '$project',
  '$unwind',
  '$addFields',
  '$count',
  '$facet',
  '$bucket',
  '$bucketAuto',
  '$sortByCount',
  '$replaceRoot',
  '$set',
  '$unset',
  '$sum',
  '$avg',
  '$min',
  '$max',
  '$first',
  '$last',
  '$push',
  '$addToSet',
  '$eq',
  '$ne',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$and',
  '$or',
  '$not',
  '$in',
  '$nin',
  '$exists',
  '$type',
  '$regex',
  '$size',
  '$all',
  '$elemMatch',
];

function hasDisallowedOperators(value, allowedOperators) {
  if (Array.isArray(value)) {
    return value.some((item) => hasDisallowedOperators(item, allowedOperators));
  }

  if (typeof value !== 'object' || value === null) {
    return false;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (key.startsWith('$') && !allowedOperators.includes(key)) {
      return true;
    }

    if (hasDisallowedOperators(nested, allowedOperators)) {
      return true;
    }
  }

  return false;
}

const documentDataSchema = z
  .object({})
  .passthrough()
  .refine((data) => !hasDisallowedOperators(data, []), {
    message: 'Invalid keys: fields starting with "$" are not allowed',
  });

const documentFilterSchema = z
  .string()
  .optional()
  .transform((value, ctx) => {
    if (!value) {
      return {};
    }

    let parsed;

    try {
      parsed = JSON.parse(value);
    } catch (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Filter must be valid JSON' });
      return z.NEVER;
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Filter must be a JSON object' });
      return z.NEVER;
    }

    if (hasDisallowedOperators(parsed, [])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Filter must not contain keys starting with "$"',
      });
      return z.NEVER;
    }

    return parsed;
  });

const createCollectionSchema = z.object({
  name: z
    .string({ required_error: 'Collection name is required' })
    .min(1, 'Name is required')
    .max(64, 'Name must not exceed 64 characters')
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      'Name must start with a letter and contain only letters, numbers, underscores'
    )
    .trim(),
  schemaRules: z.object({}).passthrough().optional().default({}),
});

const createDocumentSchema = z.object({
  data: documentDataSchema,
});

const updateDocumentSchema = z.object({
  data: documentDataSchema,
});

const queryDocumentsSchema = z.object({
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
  sort: z.string().max(64).optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  filter: documentFilterSchema,
});

const aggregateSchema = z.object({
  pipeline: z
    .array(z.object({}).passthrough())
    .min(1, 'Pipeline must have at least one stage')
    .refine((stages) => !hasDisallowedOperators(stages, ALLOWED_AGGREGATION_OPERATORS), {
      message: 'Pipeline contains disallowed operators',
    }),
});

module.exports = {
  createCollectionSchema,
  createDocumentSchema,
  updateDocumentSchema,
  queryDocumentsSchema,
  aggregateSchema,
};

const { z } = require('zod');

const createProjectSchema = z.object({
  organizationId: z
    .string({ required_error: 'Organization ID is required' })
    .min(1, 'Organization ID is required'),
  name: z
    .string({ required_error: 'Project name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  slug: z
    .string({ required_error: 'Slug is required' })
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must not exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .trim(),
});

const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
    .optional(),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
};

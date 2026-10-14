const { z } = require('zod');
const CONSTANTS = require('../config/constants');
const { ROLES } = require('../config/roles');

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const SLUG_MESSAGE = 'Slug must contain only lowercase letters, numbers, and hyphens';

const ASSIGNABLE_ROLES = [ROLES.ADMIN, ROLES.MEMBER];

const createOrganizationSchema = z.object({
  name: z
    .string({ required_error: 'Organization name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  slug: z
    .string({ required_error: 'Slug is required' })
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must not exceed 50 characters')
    .regex(SLUG_PATTERN, SLUG_MESSAGE)
    .trim(),
  plan: z.enum(CONSTANTS.PLANS).optional().default('free'),
});

const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
    .optional(),
  plan: z.enum(CONSTANTS.PLANS).optional(),
});

const inviteMemberSchema = z.object({
  userId: z
    .string({ required_error: 'User ID is required' })
    .min(1, 'User ID is required'),
  role: z.enum(ASSIGNABLE_ROLES, {
    required_error: 'Role is required',
    invalid_type_error: 'Role must be "admin" or "member"',
  }),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES, {
    required_error: 'Role is required',
    invalid_type_error: 'Role must be "admin" or "member"',
  }),
});

module.exports = {
  createOrganizationSchema,
  updateOrganizationSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
};

const { z } = require('zod');

const updateUserSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
});

module.exports = {
  updateUserSchema,
};

const { z } = require('zod');

const uploadFileSchema = z.object({
  folderPath: z
    .string()
    .max(500, 'Folder path must not exceed 500 characters')
    .optional()
    .default('/'),
});

const listFilesSchema = z.object({
  folder: z.string().max(500).optional(),
});

module.exports = {
  uploadFileSchema,
  listFilesSchema,
};

const express = require('express');
const multer = require('multer');
const storageController = require('../controllers/storage.controller');
const authenticateApiKey = require('../middleware/apiKey.middleware');
const validate = require('../middleware/validate.middleware');
const { requireScope } = require('../middleware/scope.middleware');
const { uploadFileSchema, listFilesSchema } = require('../validators/storage.validator');

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const router = express.Router({ mergeParams: true });

const READ = requireScope('storage:read');
const WRITE = requireScope('storage:write');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

router.use(authenticateApiKey);

router.post(
  '/upload',
  WRITE,
  upload.single('file'),
  validate(uploadFileSchema),
  storageController.upload
);
router.get('/files', READ, validate(listFilesSchema, 'query'), storageController.listFiles);
router.get('/files/:fileId/url', READ, storageController.getDownloadUrl);
router.delete('/files/:fileId', WRITE, storageController.remove);

module.exports = router;

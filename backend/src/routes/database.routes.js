const express = require('express');
const databaseController = require('../controllers/database.controller');
const authenticateApiKey = require('../middleware/apiKey.middleware');
const validate = require('../middleware/validate.middleware');
const { requireScope } = require('../middleware/scope.middleware');
const {
  createCollectionSchema,
  createDocumentSchema,
  updateDocumentSchema,
  queryDocumentsSchema,
  aggregateSchema,
} = require('../validators/database.validator');

const router = express.Router({ mergeParams: true });

const READ = requireScope('database:read');
const WRITE = requireScope('database:write');

router.use(authenticateApiKey);

router.post('/', WRITE, validate(createCollectionSchema), databaseController.createCollection);
router.get('/', READ, databaseController.listCollections);
router.delete('/:name', WRITE, databaseController.deleteCollection);

router.post(
  '/:name/documents',
  WRITE,
  validate(createDocumentSchema),
  databaseController.createDocument
);
router.get(
  '/:name/documents',
  READ,
  validate(queryDocumentsSchema, 'query'),
  databaseController.listDocuments
);
router.get('/:name/documents/:docId', READ, databaseController.getDocument);
router.patch(
  '/:name/documents/:docId',
  WRITE,
  validate(updateDocumentSchema),
  databaseController.updateDocument
);
router.delete('/:name/documents/:docId', WRITE, databaseController.deleteDocument);

router.post('/:name/aggregate', READ, validate(aggregateSchema), databaseController.aggregate);

module.exports = router;

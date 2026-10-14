const express = require('express');
const jobController = require('../controllers/job.controller');
const authenticateApiKey = require('../middleware/apiKey.middleware');
const validate = require('../middleware/validate.middleware');
const { requireScope } = require('../middleware/scope.middleware');
const { createJobSchema, listJobsSchema } = require('../validators/job.validator');

const router = express.Router({ mergeParams: true });

const READ = requireScope('jobs:read');
const WRITE = requireScope('jobs:write');

router.use(authenticateApiKey);

router.post('/', WRITE, validate(createJobSchema), jobController.create);
router.get('/', READ, validate(listJobsSchema, 'query'), jobController.list);
router.get('/:jobId', READ, jobController.getById);

module.exports = router;

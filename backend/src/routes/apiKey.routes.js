const express = require('express');
const apiKeyController = require('../controllers/apiKey.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { requirePermission, requireMembership } = require('../middleware/rbac.middleware');
const { PERMISSIONS } = require('../config/roles');
const { createApiKeySchema } = require('../validators/apiKey.validator');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post(
  '/',
  requirePermission(PERMISSIONS.API_KEY_CREATE),
  validate(createApiKeySchema),
  apiKeyController.create
);

router.get('/', requireMembership(), apiKeyController.list);

router.patch(
  '/:keyId/revoke',
  requirePermission(PERMISSIONS.API_KEY_REVOKE),
  apiKeyController.revoke
);

router.delete(
  '/:keyId',
  requirePermission(PERMISSIONS.API_KEY_DELETE),
  apiKeyController.remove
);

module.exports = router;

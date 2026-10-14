const express = require('express');
const projectController = require('../controllers/project.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { requirePermission, requireMembership } = require('../middleware/rbac.middleware');
const { PERMISSIONS } = require('../config/roles');
const { createProjectSchema, updateProjectSchema } = require('../validators/project.validator');

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createProjectSchema), projectController.create);
router.get('/', projectController.list);

router.get('/:projectId', requireMembership(), projectController.getById);

router.patch(
  '/:projectId',
  requirePermission(PERMISSIONS.PROJECT_UPDATE),
  validate(updateProjectSchema),
  projectController.update
);

router.delete(
  '/:projectId',
  requirePermission(PERMISSIONS.PROJECT_DELETE),
  projectController.remove
);

module.exports = router;

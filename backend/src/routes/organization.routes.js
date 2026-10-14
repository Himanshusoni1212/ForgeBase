const express = require('express');
const orgController = require('../controllers/organization.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { requirePermission, requireMembership } = require('../middleware/rbac.middleware');
const { PERMISSIONS } = require('../config/roles');
const {
  createOrganizationSchema,
  updateOrganizationSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} = require('../validators/organization.validator');

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createOrganizationSchema), orgController.create);
router.get('/', orgController.list);

router.get('/:orgId', requireMembership(), orgController.getById);

router.patch(
  '/:orgId',
  requirePermission(PERMISSIONS.ORG_UPDATE),
  validate(updateOrganizationSchema),
  orgController.update
);

router.delete('/:orgId', requirePermission(PERMISSIONS.ORG_DELETE), orgController.remove);

router.get('/:orgId/members', requireMembership(), orgController.listMembers);

router.post(
  '/:orgId/members',
  requirePermission(PERMISSIONS.ORG_MANAGE_MEMBERS),
  validate(inviteMemberSchema),
  orgController.inviteMember
);

router.patch(
  '/:orgId/members/:userId',
  requirePermission(PERMISSIONS.ORG_MANAGE_MEMBERS),
  validate(updateMemberRoleSchema),
  orgController.updateMemberRole
);

router.delete(
  '/:orgId/members/:userId',
  requirePermission(PERMISSIONS.ORG_MANAGE_MEMBERS),
  orgController.removeMember
);

module.exports = router;

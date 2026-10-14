const projectRepository = require('../repositories/project.repository');
const orgMemberRepository = require('../repositories/organizationMember.repository');
const { hasPermission } = require('../config/roles');
const ERROR_CODES = require('../constants/errorCodes');
const { AppError } = require('../utils/appError.util');

async function resolveMembership(req) {
  const userId = req.user && req.user.userId;

  if (!userId) {
    throw new AppError('Authentication required', 401, ERROR_CODES.AUTH_MISSING_TOKEN);
  }

  let organizationId = req.params.orgId;

  if (!organizationId && req.params.projectId) {
    const project = await projectRepository.findById(req.params.projectId);

    if (!project) {
      throw new AppError('Project not found', 404, ERROR_CODES.PROJECT_NOT_FOUND);
    }

    organizationId = project.organizationId.toString();
    req.project = project;
  }

  if (!organizationId) {
    throw new AppError('Organization context required', 400, ERROR_CODES.FORBIDDEN);
  }

  const membership = await orgMemberRepository.findByOrgAndUser(organizationId, userId);

  if (!membership) {
    throw new AppError('Not a member of this organization', 403, ERROR_CODES.ORG_NOT_MEMBER);
  }

  req.membership = membership;
  return membership;
}

function requirePermission(requiredPermission) {
  return async (req, res, next) => {
    try {
      const membership = await resolveMembership(req);

      if (!hasPermission(membership.role, requiredPermission)) {
        throw new AppError('Insufficient permissions', 403, ERROR_CODES.INSUFFICIENT_PERMISSIONS);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

function requireMembership() {
  return async (req, res, next) => {
    try {
      await resolveMembership(req);
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { requirePermission, requireMembership };

const organizationRepository = require('../repositories/organization.repository');
const orgMemberRepository = require('../repositories/organizationMember.repository');
const userRepository = require('../repositories/user.repository');
const { AppError } = require('../utils/appError.util');
const ERROR_CODES = require('../constants/errorCodes');
const { ROLES } = require('../config/roles');
const logger = require('../utils/logger.util');

async function createOrganization({ name, slug, plan, userId }) {
  const existing = await organizationRepository.findBySlug(slug);

  if (existing) {
    throw new AppError('Organization slug already taken', 409, ERROR_CODES.ORG_SLUG_TAKEN);
  }

  const result = await organizationRepository.create({
    name,
    slug,
    ownerId: userId,
    plan,
  });

  const orgId = result.insertedId.toString();

  await orgMemberRepository.create({
    organizationId: orgId,
    userId,
    role: ROLES.OWNER,
    invitedBy: null,
  });

  logger.info({ orgId, userId }, 'Organization created');

  return organizationRepository.findById(orgId);
}

async function listUserOrganizations(userId) {
  const memberships = await orgMemberRepository.findByUserId(userId);

  if (memberships.length === 0) {
    return [];
  }

  const orgIds = memberships.map((member) => member.organizationId.toString());
  const organizations = await organizationRepository.findByIds(orgIds);

  return organizations.map((org) => {
    const membership = memberships.find(
      (member) => member.organizationId.toString() === org._id.toString()
    );

    return { ...org, userRole: membership ? membership.role : null };
  });
}

async function getOrganization(orgId) {
  const org = await organizationRepository.findById(orgId);

  if (!org) {
    throw new AppError('Organization not found', 404, ERROR_CODES.ORG_NOT_FOUND);
  }

  return org;
}

async function updateOrganization(orgId, updateData) {
  await getOrganization(orgId);
  await organizationRepository.updateById(orgId, updateData);
  return organizationRepository.findById(orgId);
}

async function deleteOrganization(orgId, userId) {
  const org = await getOrganization(orgId);

  if (org.ownerId.toString() !== userId) {
    throw new AppError(
      'Only the owner can delete an organization',
      403,
      ERROR_CODES.INSUFFICIENT_PERMISSIONS
    );
  }

  await organizationRepository.softDelete(orgId);
  logger.info({ orgId, userId }, 'Organization soft-deleted');
}

async function listMembers(orgId) {
  return orgMemberRepository.findByOrganizationId(orgId);
}

async function inviteMember({ orgId, targetUserId, role, invitedBy }) {
  const user = await userRepository.findById(targetUserId);

  if (!user) {
    throw new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND);
  }

  const existing = await orgMemberRepository.findByOrgAndUser(orgId, targetUserId);

  if (existing) {
    throw new AppError('User is already a member', 409, ERROR_CODES.ORG_ALREADY_MEMBER);
  }

  await orgMemberRepository.create({
    organizationId: orgId,
    userId: targetUserId,
    role,
    invitedBy,
  });

  logger.info({ orgId, targetUserId, role }, 'Member invited');

  return orgMemberRepository.findByOrgAndUser(orgId, targetUserId);
}

async function updateMemberRole({ orgId, targetUserId, role }) {
  const membership = await orgMemberRepository.findByOrgAndUser(orgId, targetUserId);

  if (!membership) {
    throw new AppError('User is not a member', 404, ERROR_CODES.ORG_NOT_MEMBER);
  }

  if (membership.role === ROLES.OWNER) {
    throw new AppError('Cannot change the owner role', 403, ERROR_CODES.FORBIDDEN);
  }

  await orgMemberRepository.updateRole(orgId, targetUserId, role);
  logger.info({ orgId, targetUserId, newRole: role }, 'Member role updated');

  return orgMemberRepository.findByOrgAndUser(orgId, targetUserId);
}

async function removeMember({ orgId, targetUserId }) {
  const membership = await orgMemberRepository.findByOrgAndUser(orgId, targetUserId);

  if (!membership) {
    throw new AppError('User is not a member', 404, ERROR_CODES.ORG_NOT_MEMBER);
  }

  if (membership.role === ROLES.OWNER) {
    throw new AppError(
      'Cannot remove the organization owner',
      403,
      ERROR_CODES.ORG_CANNOT_REMOVE_OWNER
    );
  }

  await orgMemberRepository.remove(orgId, targetUserId);
  logger.info({ orgId, targetUserId }, 'Member removed');
}

module.exports = {
  createOrganization,
  listUserOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  listMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
};

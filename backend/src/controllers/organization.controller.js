const organizationService = require('../services/organization.service');
const apiResponse = require('../utils/apiResponse.util');

async function create(req, res, next) {
  try {
    const org = await organizationService.createOrganization({
      name: req.body.name,
      slug: req.body.slug,
      plan: req.body.plan,
      userId: req.user.userId,
    });

    return apiResponse.success(res, org, 'Organization created', 201);
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const orgs = await organizationService.listUserOrganizations(req.user.userId);
    return apiResponse.success(res, orgs);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const org = await organizationService.getOrganization(req.params.orgId);
    return apiResponse.success(res, org);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const org = await organizationService.updateOrganization(req.params.orgId, req.body);
    return apiResponse.success(res, org, 'Organization updated');
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await organizationService.deleteOrganization(req.params.orgId, req.user.userId);
    return apiResponse.success(res, null, 'Organization deleted');
  } catch (error) {
    next(error);
  }
}

async function listMembers(req, res, next) {
  try {
    const members = await organizationService.listMembers(req.params.orgId);
    return apiResponse.success(res, members);
  } catch (error) {
    next(error);
  }
}

async function inviteMember(req, res, next) {
  try {
    const member = await organizationService.inviteMember({
      orgId: req.params.orgId,
      targetUserId: req.body.userId,
      role: req.body.role,
      invitedBy: req.user.userId,
    });

    return apiResponse.success(res, member, 'Member invited', 201);
  } catch (error) {
    next(error);
  }
}

async function updateMemberRole(req, res, next) {
  try {
    const member = await organizationService.updateMemberRole({
      orgId: req.params.orgId,
      targetUserId: req.params.userId,
      role: req.body.role,
    });

    return apiResponse.success(res, member, 'Member role updated');
  } catch (error) {
    next(error);
  }
}

async function removeMember(req, res, next) {
  try {
    await organizationService.removeMember({
      orgId: req.params.orgId,
      targetUserId: req.params.userId,
    });

    return apiResponse.success(res, null, 'Member removed');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  listMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
};

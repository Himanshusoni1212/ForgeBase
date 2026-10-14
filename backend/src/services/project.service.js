const projectRepository = require('../repositories/project.repository');
const orgMemberRepository = require('../repositories/organizationMember.repository');
const { AppError } = require('../utils/appError.util');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger.util');

async function createProject({ organizationId, name, slug }) {
  const existing = await projectRepository.findByOrgAndSlug(organizationId, slug);

  if (existing) {
    throw new AppError(
      'Project slug already taken in this organization',
      409,
      ERROR_CODES.PROJECT_SLUG_TAKEN
    );
  }

  const result = await projectRepository.create({ organizationId, name, slug });

  logger.info({ projectId: result.insertedId, organizationId, name }, 'Project created');

  return projectRepository.findById(result.insertedId);
}

async function listProjects(userId) {
  const memberships = await orgMemberRepository.findByUserId(userId);

  if (memberships.length === 0) {
    return [];
  }

  const orgIds = memberships.map((member) => member.organizationId.toString());
  return projectRepository.findByOrganizationIds(orgIds);
}

async function getProject(projectId) {
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new AppError('Project not found', 404, ERROR_CODES.PROJECT_NOT_FOUND);
  }

  return project;
}

async function updateProject(projectId, updateData) {
  await getProject(projectId);
  await projectRepository.updateById(projectId, updateData);
  return projectRepository.findById(projectId);
}

async function deleteProject(projectId) {
  await getProject(projectId);
  await projectRepository.softDelete(projectId);
  logger.info({ projectId }, 'Project soft-deleted');
}

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
};

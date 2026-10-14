const projectService = require('../services/project.service');
const apiResponse = require('../utils/apiResponse.util');

async function create(req, res, next) {
  try {
    const project = await projectService.createProject({
      organizationId: req.body.organizationId,
      name: req.body.name,
      slug: req.body.slug,
    });

    return apiResponse.success(res, project, 'Project created', 201);
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const projects = await projectService.listProjects(req.user.userId);
    return apiResponse.success(res, projects);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const project = await projectService.getProject(req.params.projectId);
    return apiResponse.success(res, project);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const project = await projectService.updateProject(req.params.projectId, req.body);
    return apiResponse.success(res, project, 'Project updated');
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await projectService.deleteProject(req.params.projectId);
    return apiResponse.success(res, null, 'Project deleted');
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
};

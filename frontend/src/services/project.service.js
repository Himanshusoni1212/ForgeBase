// Project API calls.
//
// Verified backend contract (backend/src/routes/project.routes.js,
// validators/project.validator.js, services/project.service.js):
//   GET  /projects -> 200 { success, data: [project] }
//   POST /projects { organizationId, name, slug } -> 201 project
// project = { _id, organizationId, name, slug, environments,
//             createdAt, updatedAt }
// Name 2-100 chars; slug 2-50 chars, lowercase letters/numbers/hyphens.
// Duplicate slug in the same org -> 409 PROJECT_SLUG_TAKEN.
// The list only includes projects in organizations the user belongs to.

import { apiDelete, apiGet, apiPatch, apiPost } from "./api";

export async function listProjects(token) {
  const payload = await apiGet("/projects", { token });
  return payload.data;
}

export async function createProject(token, { organizationId, name, slug }) {
  const payload = await apiPost(
    "/projects",
    { organizationId, name, slug },
    { token }
  );
  return payload.data;
}

// Only `name` is updatable (backend updateProjectSchema). Requires
// PROJECT_UPDATE (owner/admin) — members get a 403.
export async function updateProject(token, projectId, { name }) {
  const payload = await apiPatch(
    `/projects/${projectId}`,
    { name },
    { token }
  );
  return payload.data;
}

// Soft-delete. Requires PROJECT_DELETE (owner/admin).
export async function deleteProject(token, projectId) {
  await apiDelete(`/projects/${projectId}`, { token });
}

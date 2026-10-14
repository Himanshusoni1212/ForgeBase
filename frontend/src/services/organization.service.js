// Minimal organization API calls (only what the Overview page needs:
// listing the user's orgs and creating one as part of project setup).
//
// Verified backend contract (backend/src/routes/organization.routes.js,
// validators/organization.validator.js, services/organization.service.js):
//   GET    /organizations -> 200 { success, data: [org] }
//   POST   /organizations { name, slug, plan? } -> 201 org
//   DELETE /organizations/:orgId -> 200 (owner only, else 403)
//   GET    /organizations/:orgId/members -> 200 { success, data: [membership] }
// org = { _id, name, slug, ownerId, plan, createdAt, updatedAt }
//       (+ userRole: "owner" | "admin" | "member" on the list endpoint).
// No description field exists — so none is shown.
// Name 2-100 chars; slug 2-50 chars, lowercase letters/numbers/hyphens.
// Duplicate slug -> 409 ORG_SLUG_TAKEN.
// The creator automatically becomes the org OWNER.

import { apiDelete, apiGet, apiPost } from "./api";

export async function listOrganizations(token) {
  const payload = await apiGet("/organizations", { token });
  return payload.data;
}

export async function createOrganization(token, { name, slug }) {
  const payload = await apiPost("/organizations", { name, slug }, { token });
  return payload.data;
}

export async function deleteOrganization(token, orgId) {
  await apiDelete(`/organizations/${orgId}`, { token });
}

export async function listOrgMembers(token, orgId) {
  const payload = await apiGet(`/organizations/${orgId}/members`, { token });
  return payload.data;
}

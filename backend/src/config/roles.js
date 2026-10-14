const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
};

const PERMISSIONS = {
  ORG_READ: 'org:read',
  ORG_UPDATE: 'org:update',
  ORG_DELETE: 'org:delete',
  ORG_MANAGE_MEMBERS: 'org:manage_members',

  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',

  API_KEY_CREATE: 'apiKey:create',
  API_KEY_READ: 'apiKey:read',
  API_KEY_REVOKE: 'apiKey:revoke',
  API_KEY_DELETE: 'apiKey:delete',
};

const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.ORG_READ,
    PERMISSIONS.ORG_UPDATE,
    PERMISSIONS.ORG_MANAGE_MEMBERS,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.API_KEY_CREATE,
    PERMISSIONS.API_KEY_READ,
    PERMISSIONS.API_KEY_REVOKE,
    PERMISSIONS.API_KEY_DELETE,
  ],
  [ROLES.MEMBER]: [
    PERMISSIONS.ORG_READ,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.API_KEY_READ,
  ],
};

function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
};

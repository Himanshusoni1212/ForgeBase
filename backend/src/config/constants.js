const CONSTANTS = {
  COLLECTIONS: {
    USERS: 'users',
    SESSIONS: 'sessions',
    ORGANIZATIONS: 'organizations',
    ORGANIZATION_MEMBERS: 'organizationMembers',
    PROJECTS: 'projects',
    API_KEYS: 'apiKeys',
    MANAGED_COLLECTIONS: 'managedCollections',
    MANAGED_DOCUMENTS: 'managedDocuments',
    FILES: 'files',
    JOBS: 'jobs',
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  API_KEY: {
    PREFIX: 'fb_',
    BYTE_LENGTH: 32,
    DISPLAY_PREFIX_LENGTH: 8,
    SCOPES: [
      'database:read',
      'database:write',
      'storage:read',
      'storage:write',
      'jobs:read',
      'jobs:write',
    ],
  },

  BCRYPT_ROUNDS: 12,

  RATE_LIMIT: {
    AUTH_MAX_REQUESTS: 10,
    AUTH_WINDOW_SECONDS: 60,
    AUTH_BLOCK_SECONDS: 300,
    GENERAL_MAX_REQUESTS: 100,
    GENERAL_WINDOW_SECONDS: 60,
  },

  SIGNED_URL_EXPIRY_SECONDS: 900,

  JOB: {
    MAX_ATTEMPTS: 3,
    BACKOFF_DELAY_MS: 1000,
    ENQUEUE_DELAY_MS: 100,
  },

  JOB_TYPES: ['email', 'webhook', 'cleanup'],

  PLANS: ['free', 'pro', 'enterprise'],

  ENVIRONMENTS: ['development', 'staging', 'production'],

  USER_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    DELETED: 'deleted',
  },

  JOB_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    DEAD: 'dead',
  },
};

module.exports = CONSTANTS;

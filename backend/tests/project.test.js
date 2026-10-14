const request = require('supertest');
const { MongoClient } = require('mongodb');

let app;
let db;
let client;
let accessToken;
let orgId;
let projectId;

beforeAll(async () => {
  client = new MongoClient(process.env.DATABASE_URL);
  await client.connect();
  db = client.db(process.env.DATABASE_NAME);

  // Clear collections
  const collections = await db.listCollections().toArray();
  for (const coll of collections) {
    await db.collection(coll.name).deleteMany({});
  }

  app = require('../src/app');

  const mongodb = require('../src/database/mongodb');
  await mongodb.connect();

  // Register and login a test user
  const registerRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: 'project-test@forgebase.dev',
      password: 'SecurePass123!',
      name: 'Project Test User',
    });

  accessToken = registerRes.body.data.accessToken;
});

afterAll(async () => {
  if (db) await db.dropDatabase();
  if (client) await client.close();
  const mongodb = require('../src/database/mongodb');
  await mongodb.close();
});

describe('Organization + Project API', () => {
  describe('POST /api/v1/organizations', () => {
    it('should create an organization', async () => {
      const res = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Org',
          slug: 'test-org',
          plan: 'free',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Org');
      expect(res.body.data.slug).toBe('test-org');

      orgId = res.body.data._id;
    });

    it('should reject duplicate slug', async () => {
      const res = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Another Org',
          slug: 'test-org',
        })
        .expect(409);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/organizations', () => {
    it('should list user organizations', async () => {
      const res = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].userRole).toBe('owner');
    });
  });

  describe('GET /api/v1/organizations/:orgId', () => {
    it('should get organization details', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${orgId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Org');
    });
  });

  describe('POST /api/v1/projects', () => {
    it('should create a project', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId: orgId,
          name: 'Test Project',
          slug: 'test-project',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Project');
      expect(res.body.data.slug).toBe('test-project');
      expect(res.body.data.environments).toEqual(['development', 'staging', 'production']);

      projectId = res.body.data._id;
    });

    it('should reject duplicate project slug in same org', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId: orgId,
          name: 'Another Project',
          slug: 'test-project',
        })
        .expect(409);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should list user projects', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('API Key Management', () => {
    let rawApiKey;

    it('should create an API key', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/api-keys`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Key',
          environment: 'development',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.rawKey).toBeDefined();
      expect(res.body.data.rawKey.startsWith('fb_')).toBe(true);
      expect(res.body.data.name).toBe('Test Key');

      rawApiKey = res.body.data.rawKey;
    });

    it('should list API keys (without raw key)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/api-keys`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Raw key should NOT be in list response
      for (const key of res.body.data) {
        expect(key.rawKey).toBeUndefined();
        expect(key.keyHash).toBeUndefined();
      }
    });
  });
});

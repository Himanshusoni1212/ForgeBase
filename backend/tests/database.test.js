const request = require('supertest');
const { MongoClient } = require('mongodb');

let app;
let db;
let client;
let accessToken;
let projectId;
let apiKey;

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

  // Register user
  const registerRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: 'db-test@forgebase.dev',
      password: 'SecurePass123!',
      name: 'DB Test User',
    });

  accessToken = registerRes.body.data.accessToken;

  // Create organization
  const orgRes = await request(app)
    .post('/api/v1/organizations')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: 'DB Test Org', slug: 'db-test-org' });

  const orgId = orgRes.body.data._id;

  // Create project
  const projRes = await request(app)
    .post('/api/v1/projects')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      organizationId: orgId,
      name: 'DB Test Project',
      slug: 'db-test-project',
    });

  projectId = projRes.body.data._id;

  // Create API key
  const keyRes = await request(app)
    .post(`/api/v1/projects/${projectId}/api-keys`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: 'DB Test Key', environment: 'development' });

  apiKey = keyRes.body.data.rawKey;
});

afterAll(async () => {
  if (db) await db.dropDatabase();
  if (client) await client.close();
  const mongodb = require('../src/database/mongodb');
  await mongodb.close();
});

describe('Managed Database API', () => {
  let collectionName = 'tasks';
  let docId;

  describe('Collections', () => {
    it('should create a managed collection', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/collections`)
        .set('x-api-key', apiKey)
        .send({ name: collectionName })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(collectionName);
    });

    it('should reject duplicate collection name', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/collections`)
        .set('x-api-key', apiKey)
        .send({ name: collectionName })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('COLLECTION_ALREADY_EXISTS');
    });

    it('should list managed collections', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/collections`)
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('Documents CRUD', () => {
    it('should create a document', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/collections/${collectionName}/documents`)
        .set('x-api-key', apiKey)
        .send({
          data: {
            title: 'Build ForgeBase',
            status: 'in_progress',
            priority: 1,
          },
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data.title).toBe('Build ForgeBase');
      docId = res.body.data._id;
    });

    it('should create multiple documents', async () => {
      await request(app)
        .post(`/api/v1/projects/${projectId}/collections/${collectionName}/documents`)
        .set('x-api-key', apiKey)
        .send({ data: { title: 'Write Tests', status: 'done', priority: 2 } });

      await request(app)
        .post(`/api/v1/projects/${projectId}/collections/${collectionName}/documents`)
        .set('x-api-key', apiKey)
        .send({ data: { title: 'Deploy', status: 'pending', priority: 3 } });
    });

    it('should list documents with pagination', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/collections/${collectionName}/documents`)
        .set('x-api-key', apiKey)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.documents.length).toBe(3);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.page).toBe(1);
    });

    it('should get a single document', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/collections/${collectionName}/documents/${docId}`)
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(docId.toString());
      expect(res.body.data.data.title).toBe('Build ForgeBase');
    });

    it('should update a document', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${projectId}/collections/${collectionName}/documents/${docId}`)
        .set('x-api-key', apiKey)
        .send({ data: { status: 'completed' } })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data.status).toBe('completed');
      // Original fields should be preserved (merge)
      expect(res.body.data.data.title).toBe('Build ForgeBase');
    });

    it('should reject document data with $-prefixed keys (NoSQL injection)', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/collections/${collectionName}/documents`)
        .set('x-api-key', apiKey)
        .send({ data: { '$gt': '1', title: 'Malicious' } })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should delete a document', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${projectId}/collections/${collectionName}/documents/${docId}`)
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify deleted
      await request(app)
        .get(`/api/v1/projects/${projectId}/collections/${collectionName}/documents/${docId}`)
        .set('x-api-key', apiKey)
        .expect(404);
    });
  });

  describe('Aggregation', () => {
    it('should run an aggregation pipeline', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/collections/${collectionName}/aggregate`)
        .set('x-api-key', apiKey)
        .send({
          pipeline: [
            { $group: { _id: '$data.status', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Auth Rejection', () => {
    it('should reject requests without API key', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/collections`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject requests with invalid API key', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/collections`)
        .set('x-api-key', 'fb_invalidkey12345678')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});

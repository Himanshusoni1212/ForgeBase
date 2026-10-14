# 🔥 ForgeBase — Backend-as-a-Service (BaaS)

A complete backend platform that gives you **Authentication**, **Organizations**, **Projects**, **Managed Database**, **API Keys**, **File Storage**, **Background Jobs (In-Memory)**, **Realtime WebSockets**, and **Health Monitoring** — all in a single Node.js/Express server.

---

## 📋 Table of Contents

1. [Tech Stack](#-tech-stack)
2. [Prerequisites](#-prerequisites)
3. [How to Run the Project](#-how-to-run-the-project)
4. [Project Architecture](#-project-architecture)
5. [Folder Structure](#-folder-structure)
6. [API Endpoints Overview](#-api-endpoints-overview)
7. [Testing with Insomnia — Step by Step](#-testing-with-insomnia--step-by-step)
8. [Error Codes Reference](#-error-codes-reference)
9. [Security Features](#-security-features)
10. [Troubleshooting](#-troubleshooting)

---

## 🛠 Tech Stack

| What               | Technology                          | Why                                      |
| ------------------- | ----------------------------------- | ---------------------------------------- |
| **Runtime**         | Node.js                            | JavaScript everywhere                    |
| **Framework**       | Express.js 5                       | Lightweight, flexible HTTP framework     |
| **Database**        | MongoDB (native driver, no Mongoose)| Document database, direct control        |
| **Auth**            | JWT + bcrypt                       | Secure stateless authentication          |
| **Validation**      | Zod                                | Runtime type-safe request validation     |
| **Logging**         | Pino                               | Fast structured JSON logging             |
| **Realtime**        | ws (WebSocket)                     | Low-level real-time communication        |
| **File Storage**    | AWS S3 (optional)                  | Object storage for file uploads          |
| **Env Config**      | dotenv                             | Load environment variables from `.env`   |

*(Note: Rate limiting and background jobs are currently configured to run in-memory for easy local testing, without requiring a Redis server.)*

---

## ✅ Prerequisites

Before running ForgeBase, make sure you have these installed and running:

### 1. Node.js (v18 or higher)

```bash
# Check if installed
node --version
# Should show v18.x.x or higher
```

Download from: https://nodejs.org

### 2. MongoDB (v6 or higher)

```bash
# Check if running
mongosh --eval "db.version()"
```

Download from: https://www.mongodb.com/try/download/community

> **Tip:** After installing MongoDB, make sure the MongoDB service is **running**. On Windows, it usually runs as a background service automatically.

---

## 🚀 How to Run the Project

Since we have simplified the backend for testing, **you only need Node.js and MongoDB running on your computer**.

### Step 1: Install Dependencies

```bash
cd ForgeBase
npm install
```

### Step 2: Set Up Environment Variables

The `.env` file is already configured for local development. If you need to reset it, copy the template:

```bash
cp .env.example .env
```

Your `.env` should look like this:

```env
PORT=6000
NODE_ENV=development
APP_NAME=ForgeBase

DATABASE_URL=mongodb://127.0.0.1:27017
DATABASE_NAME=forgebase

JWT_SECRET=dev_jwt_secret_change_in_production
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_change_in_production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

LOG_LEVEL=info
```

> **Note:** AWS/S3 keys are optional. You only need them if you want to test the file storage feature.

### Step 3: Start MongoDB

Make sure MongoDB is running on your machine:
```bash
# Test MongoDB connection
mongosh --eval "db.version()"
```

### Step 4: Start the Server

Run the development server (which auto-restarts when you make code changes):

```bash
npm run dev
```

You should see output like:

```
[INFO]: Connected to MongoDB: forgebase
[INFO]: MongoDB indexes created successfully
[INFO]: In-memory job queue initialized
[INFO]: In-memory worker initialized
[INFO]: WebSocket server initialized on /ws
[INFO]: ForgeBase server running on port 6000
```

### Step 5: Test the Health Endpoint

Open your browser or Insomnia and hit:

```
GET http://localhost:6000/api/v1/health
```

You should get:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 5.123,
    "timestamp": "2026-07-31T15:30:05.000Z",
    "services": {
      "mongodb": "connected"
    }
  }
}
```

✅ **If you see this, the server is running correctly! You can now move to Step 7 (Testing with Insomnia).**

---

## 🏗 Project Architecture

The project follows a strict **layered architecture**. Data flows in one direction only:

```
Route  →  Controller  →  Service  →  Repository  →  Database
```

| Layer          | Responsibility                                        | Rules                                              |
| -------------- | ----------------------------------------------------- | -------------------------------------------------- |
| **Route**      | Defines URL + HTTP method, applies middleware          | No logic — just wiring                             |
| **Controller** | Parses `req`, calls service, formats `res`            | No business logic, no direct DB calls              |
| **Service**    | All business logic, validation, auth checks           | Never touches `req`/`res`, never calls MongoDB     |
| **Repository** | Raw MongoDB operations (insert, find, update, delete) | No business logic — just database queries          |
| **Database**   | Connection management (`connect()`, `getDb()`)        | Never runs queries — only provides the connection  |

---

## 📁 Folder Structure

```
ForgeBase/
├── src/
│   ├── app.js                          # Express app setup (middleware + routes)
│   ├── server.js                       # Server bootstrap (connects DB, starts server)
│   │
│   ├── config/
│   │   ├── index.js                    # Loads .env, validates required vars
│   │   ├── constants.js                # App constants (collection names, pagination, etc.)
│   │   └── roles.js                    # RBAC role/permission matrix
│   │
│   ├── constants/
│   │   └── errorCodes.js               # All error codes (AUTH_INVALID_TOKEN, etc.)
│   │
│   ├── controllers/                    # Parse request → call service → send response
│   │
│   ├── services/                       # Business logic layer
│   │
│   ├── repositories/                   # Raw MongoDB operations only
│   │
│   ├── routes/                         # URL definitions + middleware wiring
│   │
│   ├── middleware/
│   │
│   ├── validators/                     # Zod request validation schemas
│   │
│   ├── database/
│   │   └── mongodb.js                  # MongoDB connect + getDb + indexes
│   │
│   ├── models/
│   │   └── schemas.js                  # JSDoc type definitions (no ORM)
│   │
│   ├── utils/
│   │
│   ├── realtime/
│   │   ├── socketServer.js             # WebSocket server (ws library)
│   │   └── channels.js                 # Channel subscription manager
│   │
│   ├── jobs/
│   │   ├── queue.js                    # In-memory job queue setup
│   │   ├── worker.js                   # In-memory worker + processor registry
│   │   └── processors/
│   │       └── email.processor.js      # Email job processor
│   │
│   └── storage/
│       └── s3Client.js                 # AWS S3 client (optional)
│
├── tests/                              # Integration tests (Jest + Supertest)
├── .env                                # Environment variables (not in git)
├── .env.example                        # Template for .env
├── .gitignore
├── package.json
└── README.md                           # This file
```

---

## 📡 API Endpoints Overview

**Base URL:** `http://localhost:6000/api/v1`

### Authentication Methods

ForgeBase uses **two types** of authentication:

| Type         | How to Pass                          | Used For                              |
| ------------ | ------------------------------------ | ------------------------------------- |
| **JWT Token** | `Authorization: Bearer <token>`     | User-facing routes (orgs, projects)   |
| **API Key**   | `x-api-key: <key>`                 | Developer-facing routes (DB, storage, jobs) |

### All Endpoints at a Glance

| Category       | Method   | Path                                              | Auth     |
| -------------- | -------- | ------------------------------------------------- | -------- |
| **Health**     | `GET`    | `/health`                                         | None     |
| **Auth**       | `POST`   | `/auth/register`                                  | None     |
|                | `POST`   | `/auth/login`                                     | None     |
|                | `POST`   | `/auth/refresh`                                   | None     |
|                | `POST`   | `/auth/logout`                                    | JWT      |
| **Users**      | `GET`    | `/users/me`                                       | JWT      |
|                | `PATCH`  | `/users/me`                                       | JWT      |
| **Orgs**       | `POST`   | `/organizations`                                  | JWT      |
|                | `GET`    | `/organizations`                                  | JWT      |
|                | `GET`    | `/organizations/:orgId`                           | JWT      |
|                | `PATCH`  | `/organizations/:orgId`                           | JWT      |
|                | `DELETE` | `/organizations/:orgId`                           | JWT      |
|                | `POST`   | `/organizations/:orgId/members`                   | JWT      |
|                | `PATCH`  | `/organizations/:orgId/members/:userId`           | JWT      |
|                | `DELETE` | `/organizations/:orgId/members/:userId`           | JWT      |
| **Projects**   | `POST`   | `/projects`                                       | JWT      |
|                | `GET`    | `/projects`                                       | JWT      |
|                | `GET`    | `/projects/:projectId`                            | JWT      |
|                | `PATCH`  | `/projects/:projectId`                            | JWT      |
|                | `DELETE` | `/projects/:projectId`                            | JWT      |
| **API Keys**   | `POST`   | `/projects/:projectId/api-keys`                   | JWT      |
|                | `GET`    | `/projects/:projectId/api-keys`                   | JWT      |
|                | `PATCH`  | `/projects/:projectId/api-keys/:keyId/revoke`     | JWT      |
|                | `DELETE` | `/projects/:projectId/api-keys/:keyId`            | JWT      |
| **Database**   | `POST`   | `/projects/:projectId/collections`                | API Key  |
|                | `GET`    | `/projects/:projectId/collections`                | API Key  |
|                | `POST`   | `/projects/:projectId/collections/:name/documents`| API Key  |
|                | `GET`    | `/projects/:projectId/collections/:name/documents`| API Key  |
|                | `GET`    | `/projects/:projectId/collections/:name/documents/:docId` | API Key |
|                | `PATCH`  | `/projects/:projectId/collections/:name/documents/:docId` | API Key |
|                | `DELETE` | `/projects/:projectId/collections/:name/documents/:docId` | API Key |
|                | `POST`   | `/projects/:projectId/collections/:name/aggregate`| API Key  |
| **Storage**    | `POST`   | `/projects/:projectId/storage/upload`             | API Key  |
|                | `GET`    | `/projects/:projectId/storage/files`              | API Key  |
|                | `GET`    | `/projects/:projectId/storage/files/:fileId/url`  | API Key  |
|                | `DELETE` | `/projects/:projectId/storage/files/:fileId`      | API Key  |
| **Jobs**       | `POST`   | `/projects/:projectId/jobs`                       | API Key  |
|                | `GET`    | `/projects/:projectId/jobs`                       | API Key  |
|                | `GET`    | `/projects/:projectId/jobs/:jobId`                | API Key  |

---

## 🧪 Testing with Insomnia — Step by Step

Open Insomnia and follow these steps **in order**. Each step builds on the previous one.

> 💡 **Tip:** Create a folder called "ForgeBase" in Insomnia and add each request inside it.

### Response Format

Every response follows the same structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "optional message"
}
```

**Error:**
```json
{
  "success": false,
  "message": "What went wrong",
  "code": "ERROR_CODE"
}
```

---

### 🔐 Step 1: Health Check

Verify the server is running.

```
GET http://localhost:6000/api/v1/health
```

**No headers needed. No body needed.**

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "services": {
      "mongodb": "connected"
    }
  }
}
```

---

### 🔐 Step 2: Register a User

```
POST http://localhost:6000/api/v1/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "himanshu@forgebase.dev",
  "password": "MySecurePass123",
  "name": "Himanshu Soni"
}
```

**Expected response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "6789abc...",
      "email": "himanshu@forgebase.dev",
      "name": "Himanshu Soni"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Registration successful"
}
```

> 📌 **SAVE the `accessToken`** — you'll need it for all following requests.

> 📌 **SAVE the `refreshToken`** — you'll need it to test token refresh.

---

### 🔐 Step 3: Login

```
POST http://localhost:6000/api/v1/auth/login
```

**Body (JSON):**
```json
{
  "email": "himanshu@forgebase.dev",
  "password": "MySecurePass123"
}
```

**Expected response (200):** Same format as register — new tokens issued.

**Test errors:**
- Wrong password → `401` with `AUTH_INVALID_CREDENTIALS`
- Non-existent email → `401` with `AUTH_INVALID_CREDENTIALS`

---

### 🔐 Step 4: Get Your Profile

```
GET http://localhost:6000/api/v1/users/me
```

**Headers:**
```
Authorization: Bearer <your-access-token>
```

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "6789abc...",
    "email": "himanshu@forgebase.dev",
    "name": "Himanshu Soni",
    "emailVerified": false,
    "status": "active",
    "createdAt": "2026-07-31T..."
  }
}
```

> Note: `passwordHash` is **never** returned.

---

### 🔐 Step 5: Refresh Token

```
POST http://localhost:6000/api/v1/auth/refresh
```

**Body (JSON):**
```json
{
  "refreshToken": "<your-refresh-token>"
}
```

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...(new token)",
    "refreshToken": "eyJ...(new token)"
  },
  "message": "Token refreshed"
}
```

> ⚠️ **Important:** The old refresh token is now **invalid** (token rotation). Use the new tokens from now on.

---

### 🏢 Step 6: Create an Organization

```
POST http://localhost:6000/api/v1/organizations
```

**Headers:**
```
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "My Startup",
  "slug": "my-startup",
  "plan": "free"
}
```

**Expected response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "abc123...",
    "name": "My Startup",
    "slug": "my-startup",
    "plan": "free",
    "ownerId": "6789abc...",
    "createdAt": "..."
  },
  "message": "Organization created"
}
```

> 📌 **SAVE the `_id`** — this is your `orgId`.

**Slug rules:** Only lowercase letters, numbers, and hyphens. Must be unique.

---

### 🏢 Step 7: List Your Organizations

```
GET http://localhost:6000/api/v1/organizations
```

**Headers:**
```
Authorization: Bearer <your-access-token>
```

**Expected response:** Array of orgs with your role (`userRole: "owner"`).

---

### 📦 Step 8: Create a Project

```
POST http://localhost:6000/api/v1/projects
```

**Headers:**
```
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "organizationId": "<your-orgId>",
  "name": "My App Backend",
  "slug": "my-app-backend"
}
```

**Expected response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "proj123...",
    "organizationId": "abc123...",
    "name": "My App Backend",
    "slug": "my-app-backend",
    "environments": ["development", "staging", "production"],
    "createdAt": "..."
  },
  "message": "Project created"
}
```

> 📌 **SAVE the `_id`** — this is your `projectId`.

---

### 🔑 Step 9: Generate an API Key

```
POST http://localhost:6000/api/v1/projects/<projectId>/api-keys
```

**Headers:**
```
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Dev Key",
  "environment": "development"
}
```

**Expected response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "key123...",
    "projectId": "proj123...",
    "name": "Dev Key",
    "keyPrefix": "fb_a1b2c3d4",
    "rawKey": "fb_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0...",
    "environment": "development",
    "scopes": ["database:read", "database:write", "storage:read", "storage:write", "jobs:read", "jobs:write"]
  },
  "message": "API key created. Save the raw key — it will not be shown again."
}
```

> 🚨 **CRITICAL: SAVE the `rawKey` immediately!** It is shown **only once**. You cannot retrieve it later. This key is used for all database, storage, and job operations.

---

### 📊 Step 10: Create a Managed Collection

**From here on, use the API key instead of JWT.**

```
POST http://localhost:6000/api/v1/projects/<projectId>/collections
```

**Headers:**
```
x-api-key: <your-rawKey>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "todos"
}
```

**Expected response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "coll123...",
    "projectId": "proj123...",
    "name": "todos",
    "schemaRules": {},
    "createdAt": "..."
  },
  "message": "Collection created"
}
```

---

### 📊 Step 11: Create Documents

```
POST http://localhost:6000/api/v1/projects/<projectId>/collections/todos/documents
```

**Headers:**
```
x-api-key: <your-rawKey>
Content-Type: application/json
```

**Body (JSON) — Document 1:**
```json
{
  "data": {
    "title": "Learn Node.js",
    "completed": false,
    "priority": "high"
  }
}
```

**Body (JSON) — Document 2:**
```json
{
  "data": {
    "title": "Build ForgeBase",
    "completed": true,
    "priority": "high"
  }
}
```

**Body (JSON) — Document 3:**
```json
{
  "data": {
    "title": "Deploy to AWS",
    "completed": false,
    "priority": "medium"
  }
}
```

> 📌 **SAVE a document `_id`** for the next steps.

---

### 📊 Step 12: List Documents (with Pagination)

```
GET http://localhost:6000/api/v1/projects/<projectId>/collections/todos/documents?page=1&limit=10
```

**Headers:**
```
x-api-key: <your-rawKey>
```

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "documents": [ ... ],
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 📊 Step 13: Get a Single Document

```
GET http://localhost:6000/api/v1/projects/<projectId>/collections/todos/documents/<docId>
```

**Headers:**
```
x-api-key: <your-rawKey>
```

---

### 📊 Step 14: Update a Document

```
PATCH http://localhost:6000/api/v1/projects/<projectId>/collections/todos/documents/<docId>
```

**Headers:**
```
x-api-key: <your-rawKey>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "data": {
    "completed": true,
    "completedAt": "2026-07-31"
  }
}
```

> The update **merges** with existing data. Original fields (`title`, `priority`) are preserved.

---

### 📊 Step 15: Delete a Document

```
DELETE http://localhost:6000/api/v1/projects/<projectId>/collections/todos/documents/<docId>
```

**Headers:**
```
x-api-key: <your-rawKey>
```

---

### 📊 Step 16: Run Aggregation

```
POST http://localhost:6000/api/v1/projects/<projectId>/collections/todos/aggregate
```

**Headers:**
```
x-api-key: <your-rawKey>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "pipeline": [
    { "$group": { "_id": "$data.priority", "count": { "$sum": 1 } } },
    { "$sort": { "count": -1 } }
  ]
}
```

**Expected response:** Grouped count of todos by priority.

---

### ⚙️ Step 17: Enqueue a Background Job

```
POST http://localhost:6000/api/v1/projects/<projectId>/jobs
```

**Headers:**
```
x-api-key: <your-rawKey>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "type": "email",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome!",
    "body": "Thanks for joining ForgeBase."
  }
}
```

**Expected response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "job123...",
    "type": "email",
    "status": "pending",
    "attempts": 0,
    "maxAttempts": 3
  }
}
```

---

### ⚙️ Step 18: Check Job Status

```
GET http://localhost:6000/api/v1/projects/<projectId>/jobs/<jobId>
```

**Headers:**
```
x-api-key: <your-rawKey>
```

The `status` field will be: `pending` → `processing` → `completed` (or `failed` → `dead`).

---

### ⚙️ Step 19: List All Jobs

```
GET http://localhost:6000/api/v1/projects/<projectId>/jobs?status=completed
```

**Headers:**
```
x-api-key: <your-rawKey>
```

---

### 🔐 Step 20: Logout

```
POST http://localhost:6000/api/v1/auth/logout
```

**Headers:**
```
Authorization: Bearer <your-access-token>
```

---

### 🔑 Step 21: Revoke an API Key

```
PATCH http://localhost:6000/api/v1/projects/<projectId>/api-keys/<keyId>/revoke
```

**Headers:**
```
Authorization: Bearer <your-access-token>
```

After revoking, any request using that API key will return `401`.

---

### 🛡️ Test Error Cases

Try these to see how errors work:

| Test                          | How                                              | Expected               |
| ----------------------------- | ------------------------------------------------ | ---------------------- |
| No auth token                 | Remove `Authorization` header                    | `401`                  |
| Invalid token                 | Use `Bearer invalid-token-here`                  | `401`                  |
| Wrong password                | Login with wrong password                        | `401`                  |
| Duplicate email               | Register with same email twice                   | `409`                  |
| Invalid API key               | Use `x-api-key: fb_invalidkey`                   | `401`                  |
| Missing required field        | Register without `email`                         | `400` validation error |
| NoSQL injection               | Create doc with `{"data": {"$gt": "1"}}`         | `400` rejected         |
| Non-existent resource         | GET a document with fake ID                      | `404`                  |
| Duplicate org slug            | Create two orgs with same `slug`                 | `409`                  |

---

## ❌ Error Codes Reference

| Code                        | HTTP Status | Meaning                                |
| --------------------------- | ----------- | -------------------------------------- |
| `VALIDATION_ERROR`          | 400         | Request body/query failed validation   |
| `AUTH_MISSING_TOKEN`        | 401         | No Authorization header                |
| `AUTH_INVALID_TOKEN`        | 401         | Token is malformed or invalid          |
| `AUTH_TOKEN_EXPIRED`        | 401         | JWT has expired                        |
| `AUTH_INVALID_CREDENTIALS`  | 401         | Wrong email or password                |
| `AUTH_REFRESH_FAILED`       | 401         | Refresh token is invalid/expired       |
| `AUTH_SESSION_REVOKED`      | 401         | Session was revoked (token reuse)      |
| `API_KEY_INVALID`           | 401         | API key not found or wrong             |
| `API_KEY_REVOKED`           | 401         | API key has been revoked               |
| `FORBIDDEN`                 | 403         | Action not allowed                     |
| `INSUFFICIENT_PERMISSIONS`  | 403         | Your role doesn't have this permission |
| `ORG_NOT_MEMBER`            | 403         | You're not a member of this org        |
| `NOT_FOUND`                 | 404         | Route/resource not found               |
| `USER_NOT_FOUND`            | 404         | User doesn't exist                     |
| `ORG_NOT_FOUND`             | 404         | Organization doesn't exist             |
| `PROJECT_NOT_FOUND`         | 404         | Project doesn't exist                  |
| `COLLECTION_NOT_FOUND`      | 404         | Managed collection doesn't exist       |
| `DOCUMENT_NOT_FOUND`        | 404         | Document doesn't exist                 |
| `USER_ALREADY_EXISTS`       | 409         | Email already registered               |
| `ORG_SLUG_TAKEN`            | 409         | Organization slug already in use       |
| `PROJECT_SLUG_TAKEN`        | 409         | Project slug already in use            |
| `COLLECTION_ALREADY_EXISTS` | 409         | Collection name already used           |
| `RATE_LIMIT_EXCEEDED`       | 429         | Too many requests                      |
| `INTERNAL_ERROR`            | 500         | Something went wrong on the server     |

---

## 🔒 Security Features

| Feature                   | Implementation                                              |
| ------------------------- | ----------------------------------------------------------- |
| **Password hashing**      | bcrypt with cost factor 12                                  |
| **JWT tokens**            | Access (15m) + Refresh (7d) with separate secrets           |
| **Token rotation**        | Refresh token is rotated on every refresh — old one revoked |
| **Refresh token storage** | Stored as bcrypt hash — never in plaintext                  |
| **API keys**              | Stored as bcrypt hash — raw key shown only once at creation |
| **Rate limiting**         | Memory-backed, 10 req/min on auth endpoints                 |
| **Input validation**      | Zod schemas on every route                                  |
| **NoSQL injection**       | `$`-prefixed keys are rejected in user data                 |
| **RBAC**                  | Role checks at both middleware and service layers           |
| **Error handling**        | Stack traces never leaked to client                         |

---

## 🔧 Troubleshooting

### "FATAL: Missing required environment variables"

Your `.env` file is missing some vars. Run:
```bash
cp .env.example .env
```

### "MongoServerError: connect ECONNREFUSED 127.0.0.1:27017"

MongoDB is not running. Start it:
- **Windows:** Open Services → find "MongoDB Server" → Start
- **Mac:** `brew services start mongodb-community`

### "Rate limit exceeded" on auth endpoints

You've sent too many requests in 60 seconds (limit: 10). Wait 60 seconds and try again.

### "Cannot find module" errors

Run `npm install` again to ensure all dependencies are installed.

---

## 📜 Available npm Scripts

| Command        | What it does                                  |
| -------------- | --------------------------------------------- |
| `npm start`    | Start the server in production mode           |
| `npm run dev`  | Start with nodemon (auto-restart on changes)  |
| `npm test`     | Run Jest integration tests                    |

---

## 📝 License

ISC

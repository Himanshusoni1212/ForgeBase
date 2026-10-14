// Test setup — set environment variables before any module loads
process.env.PORT = '6001';
process.env.NODE_ENV = 'test';
process.env.APP_NAME = 'ForgeBase-Test';
process.env.DATABASE_URL = 'mongodb://127.0.0.1:27017';
process.env.DATABASE_NAME = 'forgebase_test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.AWS_ACCESS_KEY = 'test_key';
process.env.AWS_SECRET_KEY = 'test_secret';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.LOG_LEVEL = 'silent';

const config = require('../config');
const apiResponse = require('../utils/apiResponse.util');

const VERSION = '1.0.0';

function getHome(req, res) {
  return apiResponse.success(
    res,
    {
      appName: config.appName,
      version: VERSION,
      description: 'Modern Backend-as-a-Service (BaaS) Platform',
      environment: config.nodeEnv,
      status: 'online',
      endpoints: {
        home: '/',
        about: '/about',
        health: '/health',
        auth: '/auth',
        users: '/users',
        organizations: '/organizations',
        projects: '/projects',
        database: '/projects/:projectId/collections',
        storage: '/projects/:projectId/storage',
        jobs: '/projects/:projectId/jobs',
        realtime: '/ws',
      },
      timestamp: new Date().toISOString(),
    },
    'Welcome to ForgeBase API'
  );
}

function getAbout(req, res) {
  return apiResponse.success(
    res,
    {
      name: 'ForgeBase',
      version: VERSION,
      description:
        'Open-source Backend-as-a-Service providing Authentication, Database, Organizations, Projects, Storage, Jobs and Realtime features.',
      stack: {
        runtime: 'Node.js',
        framework: 'Express.js',
        database: 'MongoDB Native Driver',
        logger: 'Pino',
      },
      author: 'Himanshu Soni',
    },
    'ForgeBase Platform Overview'
  );
}

module.exports = {
  getHome,
  getAbout,
};

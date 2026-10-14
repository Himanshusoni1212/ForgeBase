const express = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const organizationRoutes = require('./organization.routes');
const projectRoutes = require('./project.routes');
const apiKeyRoutes = require('./apiKey.routes');
const databaseRoutes = require('./database.routes');
const storageRoutes = require('./storage.routes');
const jobRoutes = require('./job.routes');
const healthRoutes = require('./health.routes');
const homeController = require('../controllers/home.controller');

const router = express.Router();

router.get('/', homeController.getHome);
router.get('/about', homeController.getAbout);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

router.use('/users', userRoutes);
router.use('/organizations', organizationRoutes);

router.use('/projects/:projectId/api-keys', apiKeyRoutes);
router.use('/projects/:projectId/collections', databaseRoutes);
router.use('/projects/:projectId/storage', storageRoutes);
router.use('/projects/:projectId/jobs', jobRoutes);

router.use('/projects', projectRoutes);

module.exports = router;

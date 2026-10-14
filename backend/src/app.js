const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const requestLogger = require('./middleware/requestLogger.middleware');
const { generalRateLimiter } = require('./middleware/rateLimiter.middleware');
const errorMiddleware = require('./middleware/error.middleware');
const notFound = require('./middleware/notFound.middleware');
const apiRoutes = require('./routes/index.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(generalRateLimiter);

app.use('/', apiRoutes);

app.use(notFound);
app.use(errorMiddleware);

module.exports = app;

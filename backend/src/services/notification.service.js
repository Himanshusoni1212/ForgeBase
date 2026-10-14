const logger = require('../utils/logger.util');

async function sendEmail({ to, subject, body, template }) {
  logger.info({ to, subject, template }, 'Sending email notification');
  return { sent: true, channel: 'email', to };
}

async function sendInApp({ userId, title, message, type = 'info' }) {
  logger.info({ userId, title, type }, 'Sending in-app notification');
  return { sent: true, channel: 'in-app', userId };
}

async function sendWebhook({ url, payload }) {
  logger.info({ url }, 'Sending webhook notification');
  return { sent: true, channel: 'webhook', url };
}

module.exports = {
  sendEmail,
  sendInApp,
  sendWebhook,
};

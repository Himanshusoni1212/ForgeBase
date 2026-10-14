const { WebSocketServer } = require('ws');
const crypto = require('crypto');
const channels = require('./channels');
const apiKeyService = require('../services/apiKey.service');
const logger = require('../utils/logger.util');

const HEARTBEAT_INTERVAL_MS = 30000;
const SUPPORTED_ACTIONS = 'authenticate, subscribe, unsubscribe, ping';

function send(ws, payload) {
  ws.send(JSON.stringify(payload));
}

async function handleAuthenticate(ws, message) {
  if (!message.apiKey) {
    send(ws, { event: 'error', message: 'API key required for authentication' });
    return;
  }

  try {
    const { project } = await apiKeyService.verifyRawKey(message.apiKey);

    ws.authenticated = true;
    ws.projectId = project._id.toString();

    send(ws, { event: 'authenticated', projectId: ws.projectId });
  } catch (error) {
    logger.warn({ err: error }, 'WebSocket authentication failed');
    send(ws, { event: 'error', message: 'Invalid API key' });
  }
}

function handleSubscribe(ws, message) {
  if (!ws.authenticated) {
    send(ws, { event: 'error', message: 'Authenticate first' });
    return;
  }

  const projectId = message.projectId || ws.projectId;

  if (projectId !== ws.projectId) {
    send(ws, { event: 'error', message: 'Cannot subscribe to other projects' });
    return;
  }

  const collection = message.collection || null;

  channels.subscribe(projectId, collection, ws);
  send(ws, { event: 'subscribed', projectId, collection: collection || '*' });
}

function handleUnsubscribe(ws, message) {
  const projectId = message.projectId || ws.projectId;
  const collection = message.collection || null;

  channels.unsubscribe(projectId, collection, ws);
  send(ws, { event: 'unsubscribed', projectId, collection: collection || '*' });
}

async function handleMessage(ws, message) {
  switch (message.action) {
    case 'authenticate':
      await handleAuthenticate(ws, message);
      break;
    case 'subscribe':
      handleSubscribe(ws, message);
      break;
    case 'unsubscribe':
      handleUnsubscribe(ws, message);
      break;
    case 'ping':
      send(ws, { event: 'pong', timestamp: new Date().toISOString() });
      break;
    default:
      send(ws, {
        event: 'error',
        message: `Unknown action: ${message.action}. Supported: ${SUPPORTED_ACTIONS}`,
      });
  }
}

function initSocketServer(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    ws.clientId = crypto.randomUUID();
    ws.isAlive = true;
    ws.authenticated = false;
    ws.projectId = null;

    logger.info(
      { clientId: ws.clientId, ip: req.socket.remoteAddress },
      'WebSocket client connected'
    );

    send(ws, {
      event: 'connected',
      clientId: ws.clientId,
      message: 'Connected to ForgeBase Realtime',
    });

    ws.on('message', async (rawMessage) => {
      let message;

      try {
        message = JSON.parse(rawMessage.toString());
      } catch (error) {
        send(ws, {
          event: 'error',
          message: 'Invalid message format. Send JSON with { action, ... }',
        });
        return;
      }

      try {
        await handleMessage(ws, message);
      } catch (error) {
        logger.error({ clientId: ws.clientId, err: error }, 'WebSocket message failed');
        send(ws, { event: 'error', message: 'Failed to handle message' });
      }
    });

    ws.on('close', () => {
      channels.unsubscribeAll(ws);
      logger.info({ clientId: ws.clientId }, 'WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      logger.error({ clientId: ws.clientId, err: error }, 'WebSocket error');
    });

    ws.on('pong', () => {
      ws.isAlive = true;
    });
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        channels.unsubscribeAll(ws);
        ws.terminate();
        continue;
      }

      ws.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);

  wss.on('close', () => clearInterval(heartbeat));

  logger.info('WebSocket server initialized on /ws');

  return wss;
}

module.exports = { initSocketServer };

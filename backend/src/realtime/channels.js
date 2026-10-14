const { WebSocket } = require('ws');
const logger = require('../utils/logger.util');

const channels = new Map();

function channelKey(projectId, collectionName = null) {
  if (collectionName) {
    return `project:${projectId}:collection:${collectionName}`;
  }
  return `project:${projectId}`;
}

function subscribe(projectId, collectionName, ws) {
  const key = channelKey(projectId, collectionName);

  if (!channels.has(key)) {
    channels.set(key, new Set());
  }

  channels.get(key).add(ws);
  logger.debug({ channel: key }, 'Client subscribed to channel');
}

function unsubscribe(projectId, collectionName, ws) {
  const key = channelKey(projectId, collectionName);
  const subscribers = channels.get(key);

  if (!subscribers) {
    return;
  }

  subscribers.delete(ws);

  if (subscribers.size === 0) {
    channels.delete(key);
  }
}

function unsubscribeAll(ws) {
  for (const [key, subscribers] of channels) {
    subscribers.delete(ws);

    if (subscribers.size === 0) {
      channels.delete(key);
    }
  }
}

function broadcast(projectId, collectionName, event, data) {
  const message = JSON.stringify({
    event,
    projectId,
    collection: collectionName,
    data,
    timestamp: new Date().toISOString(),
  });

  const recipients = new Set();

  for (const key of [channelKey(projectId, collectionName), channelKey(projectId)]) {
    const subscribers = channels.get(key);

    if (subscribers) {
      for (const ws of subscribers) {
        recipients.add(ws);
      }
    }
  }

  for (const ws of recipients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

module.exports = {
  subscribe,
  unsubscribe,
  unsubscribeAll,
  broadcast,
};

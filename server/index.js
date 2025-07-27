const path = require('path');
const express = require('express');
const { SimplePool, verifyEvent } = require('nostr-tools');
const { relays, prunePolicy } = require('./config');
const app = express();
const pool = new SimplePool();
const fallbackVersions = {};

const REPLACEABLE_KINDS = new Set([41, 30001, 30023, 30033]);

const PORT = process.env.PORT || 3000;
const API_BASE = process.env.API_BASE || '/api';

app.use(express.json());

async function actionHandler(req, res) {
  console.log('action', req.body);
  const event = req.body;

  if (REPLACEABLE_KINDS.has(event.kind)) {
    if (!req.user || req.user.pubkey !== event.pubkey) {
      res.status(400).json({ error: 'pubkey mismatch' });
      return;
    }
    if (!verifyEvent(event)) {
      res.status(400).json({ error: 'invalid signature' });
      return;
    }
  }

  const activeRelays = relays.filter(
    (r) => r.retentionDays >= prunePolicy.minimumDays,
  );
  const targets = activeRelays
    .filter((r) => r.supportsNip27)
    .map((r) => r.url);

  let fallbackVersion;
  if (relays.some((r) => !r.supportsNip27) && Array.isArray(event.tags)) {
    const dTag = event.tags.find((t) => t[0] === 'd');
    if (dTag) {
      const base = dTag[1];
      fallbackVersions[base] = (fallbackVersions[base] || 0) + 1;
      fallbackVersion = fallbackVersions[base];
      dTag[1] = `${base}-v${fallbackVersion}`;
    }
  }

  try {
    await pool.publish(targets, event);
    res.json({ status: 'ok', fallbackVersion });
  } catch (err) {
    console.error('publish failed', err);
    res.status(500).json({ error: 'publish failed' });
  }
}

app.post(`${API_BASE}/action`, actionHandler);

async function eventHandler(req, res) {
  console.log('event', req.body);
  const event = req.body;

  if (REPLACEABLE_KINDS.has(event.kind)) {
    if (!req.user || req.user.pubkey !== event.pubkey) {
      res.status(400).json({ error: 'pubkey mismatch' });
      return;
    }
    if (!verifyEvent(event)) {
      res.status(400).json({ error: 'invalid signature' });
      return;
    }
  }

  const targets = relays
    .filter((r) => r.supportsNip27 && r.retentionDays >= prunePolicy.minimumDays)
    .map((r) => r.url);
  try {
    await pool.publish(targets, event);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('publish failed', err);
    res.status(500).json({ error: 'publish failed' });
  }
}

app.post(`${API_BASE}/event`, eventHandler);

app.post(`${API_BASE}/subscribe`, (req, res) => {
  console.log('subscribe', req.body);
  res.json({ status: 'ok' });
});

app.delete(`${API_BASE}/subscribe`, (req, res) => {
  console.log('unsubscribe', req.body);
  res.json({ status: 'ok' });
});

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (_, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = {
  app,
  actionHandler,
  eventHandler,
  fallbackVersions,
  pool,
};

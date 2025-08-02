/**
 * Node API server used in production.
 *
 * Routes:
 *   POST `${API_BASE}/action`    – publish an action event to configured relays
 *   POST `${API_BASE}/event`     – publish an arbitrary event to configured relays
 *   POST `${API_BASE}/subscribe` – save a push subscription
 *   DELETE `${API_BASE}/subscribe` – remove a push subscription
 *
 * Events are forwarded using `SimplePool` from `nostr-tools`. Targets are the
 * relays listed in `server/config.js` whose retention meets `prunePolicy`. The
 * original event is sent to NIP‑27 relays; non‑NIP‑27 relays receive copies
 * whose `d` tag is suffixed with `-v<nr>`.
 *
 * Configuration options come from `server/config.js`:
 *   - `relays`: array of relay definitions `{ url, supportsNip27, retentionDays }`
 *   - `prunePolicy.minimumDays`: minimum retention required when forwarding
 *                                 replaceable events
 */
const path = require('path');
const fs = require('fs/promises');
const express = require('express');
const { SimplePool, verifyEvent } = require('nostr-tools');
const { relays, prunePolicy } = require('./config');
const auth = require('./auth');
const app = express();
const pool = new SimplePool();
const fallbackVersions = {};

const REPLACEABLE_KINDS = new Set([41, 30001, 30023, 30033]);

const PORT = process.env.PORT || 3000;
const API_BASE = process.env.API_BASE || '/api';

app.use(express.json());
app.use(API_BASE, auth);

const SUBSCRIPTIONS_FILE = path.join(__dirname, 'subscriptions.json');

async function getSubscriptions() {
  try {
    const raw = await fs.readFile(SUBSCRIPTIONS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function saveSubscriptions(subs) {
  await fs.writeFile(
    SUBSCRIPTIONS_FILE,
    JSON.stringify(subs, null, 2),
  );
}

async function addSubscription(sub) {
  const subs = await getSubscriptions();
  if (!subs.find((s) => s.endpoint === sub.endpoint)) {
    subs.push(sub);
    await saveSubscriptions(subs);
  }
}

async function removeSubscription(endpoint) {
  const subs = await getSubscriptions();
  const filtered = subs.filter((s) => s.endpoint !== endpoint);
  await saveSubscriptions(filtered);
}

async function clearSubscriptions() {
  await saveSubscriptions([]);
}

function isValidSubscription(sub) {
  return (
    sub &&
    typeof sub.endpoint === 'string' &&
    sub.keys &&
    typeof sub.keys.p256dh === 'string' &&
    typeof sub.keys.auth === 'string'
  );
}

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
  const nip27Targets = activeRelays
    .filter((r) => r.supportsNip27)
    .map((r) => r.url);
  const nonNip27Targets = activeRelays
    .filter((r) => !r.supportsNip27)
    .map((r) => r.url);

  let fallbackVersion;
  let fallbackEvent = event;
  if (nonNip27Targets.length && Array.isArray(event.tags)) {
    const dTag = event.tags.find((t) => t[0] === 'd');
    if (dTag) {
      const base = dTag[1];
      fallbackVersions[base] = (fallbackVersions[base] || 0) + 1;
      fallbackVersion = fallbackVersions[base];
      fallbackEvent = {
        ...event,
        tags: event.tags.map((t) => [...t]),
      };
      const dTagClone = fallbackEvent.tags.find((t) => t[0] === 'd');
      dTagClone[1] = `${base}-v${fallbackVersion}`;
    }
  }

  try {
    if (nip27Targets.length) {
      await pool.publish(nip27Targets, event);
    }
    if (nonNip27Targets.length) {
      await pool.publish(nonNip27Targets, fallbackEvent);
    }
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

app.post(`${API_BASE}/subscribe`, async (req, res) => {
  const sub = req.body;
  if (!isValidSubscription(sub)) {
    res.status(400).json({ error: 'invalid subscription' });
    return;
  }
  try {
    await addSubscription(sub);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('subscribe failed', err);
    res.status(500).json({ error: 'subscribe failed' });
  }
});

app.delete(`${API_BASE}/subscribe`, async (req, res) => {
  const { endpoint } = req.body || {};
  if (typeof endpoint !== 'string') {
    res.status(400).json({ error: 'invalid subscription' });
    return;
  }
  try {
    await removeSubscription(endpoint);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('unsubscribe failed', err);
    res.status(500).json({ error: 'unsubscribe failed' });
  }
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
  addSubscription,
  removeSubscription,
  getSubscriptions,
  clearSubscriptions,
};

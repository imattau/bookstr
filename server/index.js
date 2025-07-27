const path = require('path');
const express = require('express');
const { SimplePool } = require('nostr-tools');
const { relays, prunePolicy } = require('./config');
const app = express();
const pool = new SimplePool();

const PORT = process.env.PORT || 3000;
const API_BASE = process.env.API_BASE || '/api';

app.use(express.json());

app.post(`${API_BASE}/action`, (req, res) => {
  console.log('action', req.body);
  res.json({ status: 'ok' });
});

app.post(`${API_BASE}/event`, async (req, res) => {
  console.log('event', req.body);
  const targets = relays
    .filter((r) => r.supportsNip27 && r.retentionDays >= prunePolicy.minimumDays)
    .map((r) => r.url);
  try {
    await pool.publish(targets, req.body);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('publish failed', err);
    res.status(500).json({ error: 'publish failed' });
  }
});

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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

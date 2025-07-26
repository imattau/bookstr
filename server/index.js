const path = require('path');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const API_BASE = process.env.API_BASE || '/api';

app.use(express.json());

app.post(`${API_BASE}/action`, (req, res) => {
  console.log('action', req.body);
  res.json({ status: 'ok' });
});

app.post(`${API_BASE}/event`, (req, res) => {
  console.log('event', req.body);
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

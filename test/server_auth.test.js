require('ts-node/register');
const assert = require('assert');
const { app, pool } = require('../server');
const { finalizeEvent, generateSecretKey, getPublicKey } = require('nostr-tools');

(async () => {
  let published;
  pool.publish = async (_targets, evt) => { published = evt; };

  const server = app.listen(0);
  const port = server.address().port;
  const url = `http://localhost:${port}/api/event`;

  const sk = generateSecretKey();
  const pub = getPublicKey(sk);
  const authEvent = finalizeEvent({
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['u', url],
      ['method', 'POST'],
    ],
    content: '',
    pubkey: pub,
  }, sk);
  const authHeader = 'Nostr ' + Buffer.from(JSON.stringify(authEvent)).toString('base64');

  const evt = finalizeEvent({
    kind: 41,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: '',
    pubkey: pub,
  }, sk);

  let res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(evt),
  });
  let body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.status, 'ok');
  assert.strictEqual(published.id, evt.id);

  const badAuth = { ...authEvent, sig: '0'.repeat(128) };
  const badHeader = 'Nostr ' + Buffer.from(JSON.stringify(badAuth)).toString('base64');
  res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: badHeader,
    },
    body: JSON.stringify(evt),
  });
  assert.strictEqual(res.status, 401);
  body = await res.json();
  assert.ok(body.error);

  server.close();
  console.log('All tests passed.');
})();

require('ts-node/register');
const assert = require('assert');
const { app, getSubscriptions, clearSubscriptions } = require('../server');

(async () => {
  await clearSubscriptions();

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/api`;

  const sub = {
    endpoint: 'https://example.com',
    keys: { p256dh: 'p', auth: 'a' },
  };

  let res = await fetch(`${base}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub),
  });
  assert.strictEqual(res.status, 200);
  let body = await res.json();
  assert.strictEqual(body.status, 'ok');
  let subs = await getSubscriptions();
  assert.strictEqual(subs.length, 1);
  assert.deepStrictEqual(subs[0], sub);

  res = await fetch(`${base}/subscribe`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  assert.strictEqual(res.status, 200);
  body = await res.json();
  assert.strictEqual(body.status, 'ok');
  subs = await getSubscriptions();
  assert.strictEqual(subs.length, 0);

  res = await fetch(`${base}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.strictEqual(res.status, 400);
  body = await res.json();
  assert.ok(body.error);

  await clearSubscriptions();
  await new Promise((resolve) => server.close(resolve));
  console.log('All tests passed.');
})();

require('ts-node/register');
const assert = require('assert');
const { eventHandler, pool } = require('../server');
const { finalizeEvent, generateSecretKey } = require('nostr-tools');

(async () => {
  let published;
  pool.publish = async (_targets, evt) => { published = evt; };

  const sk = generateSecretKey();
  const validEvent = finalizeEvent({
    kind: 41,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: '',
  }, sk);

  const res = { status(code) { this.statusCode = code; return this; }, json(obj) { this.body = obj; } };

  await eventHandler({ body: JSON.parse(JSON.stringify(validEvent)), user: { pubkey: validEvent.pubkey } }, res);
  assert.strictEqual(res.statusCode, undefined);
  assert.strictEqual(res.body.status, 'ok');
  assert.strictEqual(published.id, validEvent.id);

  res.statusCode = undefined; res.body = null; published = null;
  await eventHandler({ body: JSON.parse(JSON.stringify(validEvent)), user: { pubkey: 'bad' } }, res);
  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.body.error);

  const badSig = { ...validEvent, sig: '0'.repeat(128) };
  res.statusCode = undefined; res.body = null; published = null;
  await eventHandler({ body: badSig, user: { pubkey: validEvent.pubkey } }, res);
  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.body.error);

  console.log('All tests passed.');
})();

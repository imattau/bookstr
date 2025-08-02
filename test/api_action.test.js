require('ts-node/register');
const assert = require('assert');
const { actionHandler, fallbackVersions, pool } = require('../server');
const { finalizeEvent, generateSecretKey } = require('nostr-tools');

(async () => {
  let published = [];
  pool.publish = async (_targets, evt) => {
    published.push(JSON.parse(JSON.stringify(evt)));
  };

  const res = { json: () => {}, status: () => res, body: null };

  const sk = generateSecretKey();
  const baseEvent = finalizeEvent({
    kind: 30001,
    created_at: Math.floor(Date.now() / 1000),
    content: '',
    tags: [['d', 'library']],
  }, sk);

  await actionHandler({ body: JSON.parse(JSON.stringify(baseEvent)), user: { pubkey: baseEvent.pubkey } }, res);
  assert.strictEqual(fallbackVersions['library'], 1);
  assert.strictEqual(published.length, 2);
  assert.strictEqual(
    published[0].tags.find((t) => t[0] === 'd')[1],
    'library',
  );
  assert.strictEqual(
    published[1].tags.find((t) => t[0] === 'd')[1],
    'library-v1',
  );

  published = [];
  await actionHandler({ body: JSON.parse(JSON.stringify(baseEvent)), user: { pubkey: baseEvent.pubkey } }, res);
  assert.strictEqual(fallbackVersions['library'], 2);
  assert.strictEqual(published.length, 2);
  assert.strictEqual(
    published[0].tags.find((t) => t[0] === 'd')[1],
    'library',
  );
  assert.strictEqual(
    published[1].tags.find((t) => t[0] === 'd')[1],
    'library-v2',
  );

  console.log('All tests passed.');
})();

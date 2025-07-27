require('ts-node/register');
const assert = require('assert');
const { actionHandler, fallbackVersions, pool } = require('../server');

(async () => {
  let published;
  pool.publish = async (_targets, evt) => {
    published = JSON.parse(JSON.stringify(evt));
  };

  const res = { json: () => {}, status: () => res, body: null };

  const baseEvent = { kind: 30001, content: '', tags: [['d', 'library']] };

  await actionHandler({ body: JSON.parse(JSON.stringify(baseEvent)) }, res);
  assert.strictEqual(fallbackVersions['library'], 1);
  assert.strictEqual(
    published.tags.find((t) => t[0] === 'd')[1],
    'library-v1',
  );

  await actionHandler({ body: JSON.parse(JSON.stringify(baseEvent)) }, res);
  assert.strictEqual(fallbackVersions['library'], 2);
  assert.strictEqual(
    published.tags.find((t) => t[0] === 'd')[1],
    'library-v2',
  );

  console.log('All tests passed.');
})();

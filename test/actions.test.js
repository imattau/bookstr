require('ts-node/register');
const assert = require('assert');
const { queueAction } = require('../src/actions');

(async () => {
  let args;
  global.fetch = async (...a) => {
    args = a;
    return {};
  };
  await queueAction({ foo: 'bar' });
  assert.strictEqual(args[0], '/api/action');
  assert.strictEqual(args[1].method, 'POST');
  assert.strictEqual(args[1].headers['Content-Type'], 'application/json');
  assert.strictEqual(args[1].body, JSON.stringify({ foo: 'bar' }));

  global.fetch = async () => {
    throw new Error('fail');
  };
  await queueAction({ hello: 'world' });

  console.log('All tests passed.');
})();

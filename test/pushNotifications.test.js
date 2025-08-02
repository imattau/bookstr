require('ts-node/register');
const assert = require('assert');
const {
  eventHandler,
  addSubscription,
  clearSubscriptions,
  getSubscriptions,
  webpush,
  pool,
} = require('../server');

(async () => {
  await clearSubscriptions();
  pool.publish = async () => {};
  const sub = { endpoint: 'https://example.com', keys: { p256dh: 'p', auth: 'a' } };
  await addSubscription(sub);

  let calls = 0;
  webpush.sendNotification = async () => {
    calls++;
  };

  const res = { json: () => {}, status: () => res };
  const event = { kind: 1, created_at: 0, content: '', tags: [] };

  await eventHandler({ body: event }, res);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.strictEqual(calls, 1);

  await clearSubscriptions();
  await addSubscription(sub);
  webpush.sendNotification = async () => {
    const err = new Error('gone');
    err.statusCode = 410;
    throw err;
  };

  await eventHandler({ body: event }, res);
  await new Promise((resolve) => setTimeout(resolve, 10));
  const subs = await getSubscriptions();
  assert.strictEqual(subs.length, 0);

  console.log('All tests passed.');
})();

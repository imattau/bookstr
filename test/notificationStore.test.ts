require('ts-node/register');
const assert = require('assert');
const { useNotificationStore } = require('../src/store/notifications');

(() => {
  const { add, markAllSeen } = useNotificationStore.getState();
  add('a');
  add('a');
  add('b');
  assert.deepStrictEqual(useNotificationStore.getState().unseen.sort(), ['a', 'b']);
  markAllSeen();
  assert.deepStrictEqual(useNotificationStore.getState().unseen, []);
  console.log('All tests passed.');
})();

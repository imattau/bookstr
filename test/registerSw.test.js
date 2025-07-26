require('ts-node/register');
const assert = require('assert');
const { registerServiceWorker } = require('../src/registerSw');

(async () => {
  if (!global.navigator) global.navigator = {};
  let called = null;
  global.navigator.serviceWorker = { register: (url) => { called = url; } };
  global.window = { addEventListener: (ev, cb) => { if (ev === 'load') cb(); } };
  registerServiceWorker();
  assert.strictEqual(called, '/sw.js');

  delete navigator.serviceWorker;
  registerServiceWorker();

  console.log('All tests passed.');
})();

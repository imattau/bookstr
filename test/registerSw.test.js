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

  const fs = require('fs');
  const path = require('path');
  const swSrc = fs.readFileSync(path.join(__dirname, '../src/sw.ts'), 'utf8');
  assert(swSrc.includes("cacheName: 'events'"), 'events cache route missing');

  console.log('All tests passed.');
})();

require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../../src/pages/OfflineSettings.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: ['react', '../src/offlineStore.ts'],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const sandbox = {
    require: (p) => {
      if (p.includes('offlineStore')) {
        return {
          clearOfflineBooks: async () => {},
          getCacheSize: async () => 0,
          getLastSynced: async () => 0,
          isBackgroundSync: async () => true,
          isOfflineMode: async () => true,
          setBackgroundSync: async () => {},
          setOfflineMode: async () => {},
        };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'OfflineSettingsPage.js' });
  const { OfflineSettingsPage } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(OfflineSettingsPage));
    await Promise.resolve();
  });

  assert.ok(renderer.toJSON());
  console.log('All tests passed.');
})();

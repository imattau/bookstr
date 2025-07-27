require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../../src/pages/NotificationSettings.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: ['react', '../src/useSettings.ts', '../src/useNotificationSettings.ts', '../src/push.ts'],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const sandbox = {
    require: (p) => {
      if (p.includes('useSettings')) return { useSettings: () => ({ pushEnabled: true, setPushEnabled: () => {} }) };
      if (p.includes('useNotificationSettings')) return { useNotificationSettings: () => ({ newBooks: true, zapReceipts: true, chatMentions: true, setNewBooks: () => {}, setZapReceipts: () => {}, setChatMentions: () => {} }) };
      if (p.includes('push')) return { registerPushSubscription: async () => {}, unregisterPushSubscription: async () => {} };
      return require(p);
    },
    module,
    exports: module.exports,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'NotificationSettingsPage.js' });
  const { NotificationSettingsPage } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(NotificationSettingsPage));
    await Promise.resolve();
  });

  assert.ok(renderer.toJSON());
  console.log('All tests passed.');
})();

require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../../src/pages/PaymentSettings.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: ['react', '../src/nostr.tsx', '../src/usePaymentSettings.ts'],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const sandbox = {
    require: (p) => {
      if (p.includes('nostr')) return { useNostr: () => ({ nip07: true }) , connectNostrWallet: async () => '', nostrLogin: async () => {}, getPrivKey: () => '' };
      if (p.includes('usePaymentSettings')) return { usePaymentSettings: () => ({ minZap: 1, maxZap: 10, address: '', autoPayThreshold: 0, setMinZap: () => {}, setMaxZap: () => {}, setAddress: () => {}, setAutoPayThreshold: () => {} }) };
      return require(p);
    },
    module,
    exports: module.exports,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'PaymentSettingsPage.js' });
  const { PaymentSettingsPage } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(PaymentSettingsPage));
    await Promise.resolve();
  });

  assert.ok(renderer.toJSON());
  console.log('All tests passed.');
})();

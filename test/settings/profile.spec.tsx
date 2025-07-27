require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../../src/pages/ProfileSettings.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: ['react', 'react-router-dom', '../src/nostr.tsx', 'nostr-tools', '@noble/hashes/utils'],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  let saved;
  let nav;
  const sandbox = {
    require: (p) => {
      if (p.includes('nostr')) {
        return {
          useNostr: () => ({ metadata: {}, pubkey: 'pk' }),
          verifyNip05: async () => true,
          getPrivKey: () => 'priv',
        };
      }
      if (p === 'nostr-tools') {
        return { finalizeEvent: (tpl) => ({ ...tpl, id: '1', sig: 'sig' }) };
      }
      if (p === '@noble/hashes/utils') {
        return { hexToBytes: () => [] };
      }
      if (p === 'react-router-dom') {
        return { useNavigate: () => (url) => { nav = url; } };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    React,
    fetch: async (url, opts) => { saved = JSON.parse(opts.body); return { ok: true }; },
  };
  vm.runInNewContext(code, sandbox, { filename: 'ProfileSettingsPage.js' });
  const { ProfileSettingsPage } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(ProfileSettingsPage));
    await Promise.resolve();
  });

  await TestRenderer.act(async () => {
    const btn = renderer.root.find((n) => n.type === 'button' && n.children.includes('Save'));
    await btn.props.onClick();
    await Promise.resolve();
  });

  assert.strictEqual(saved.kind, 0);
  assert.strictEqual(nav, '/profile');
  console.log('All tests passed.');
})();

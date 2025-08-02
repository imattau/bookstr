require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../../src/pages/RelaySettings.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: [
      'react',
      '../src/nostr.tsx',
      '../src/nostr/relays.ts',
      '../src/components/OnboardingTooltip.tsx',
    ],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  let saved;
  const calls = [];
  const sandbox = {
    require: (p) => {
      if (p.includes('nostr.tsx')) {
        return {
          useNostr: () => ({
            relays: ['wss://a'],
            contacts: ['pk1', 'pk2'],
            saveRelays: (list) => {
              saved = list;
            },
          }),
        };
      }
      if (p.includes('nostr/relays')) {
        return {
          fetchUserRelays: async (pk) => {
            calls.push(pk);
            if (pk === 'pk1') return ['wss://b'];
            if (pk === 'pk2') return ['wss://a', 'wss://c'];
            return [];
          },
        };
      }
      if (p.includes('OnboardingTooltip')) {
        return {
          OnboardingTooltip: ({ children }) => children,
        };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    TextDecoder,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'RelaySettingsPage.js' });
  const { RelaySettingsPage } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(RelaySettingsPage));
    await Promise.resolve();
  });

  await TestRenderer.act(async () => {
    const btn = renderer.root.find(
      (n) => n.type === 'button' && n.children.includes('Add relays from followed authors'),
    );
    await btn.props.onClick();
    await Promise.resolve();
  });

  assert.deepStrictEqual(new Set(saved), new Set(['wss://a', 'wss://b', 'wss://c']));
  assert.deepStrictEqual(calls, ['pk1', 'pk2']);
  console.log('All tests passed.');
})();

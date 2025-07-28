require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/components/RepostButton.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: [
      'react',
      'react-icons/fa',
      './src/nostr.tsx',
      './src/components/ToastProvider.tsx',
    ],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const calls = [];
  const sandbox = {
    require: (p) => {
      if (p === './src/nostr.tsx') {
        return {
          useNostr: () => ({}),
          publishRepost: async () => { throw new Error('fail'); },
        };
      }
      if (p === './src/components/ToastProvider.tsx') {
        return { useToast: () => (msg) => calls.push(msg) };
      }
      if (p === 'react-icons/fa') {
        return { FaRetweet: () => React.createElement('div') };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'RepostButton.js' });
  const { RepostButton } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(RepostButton, { target: '1' }));
    await Promise.resolve();
  });

  await TestRenderer.act(async () => {
    renderer.root.findByType('button').props.onClick();
    await Promise.resolve();
  });

  assert.ok(calls.includes('Action failed'), 'addToast should be called');
  console.log('All tests passed.');
})();

require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/screens/HomeFeed.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: [
      'react',
      './src/nostr.tsx',
      './src/components/NoteCard.tsx',
    ],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const calls = [];
  const sandbox = {
    require: (p) => {
      if (p === './src/nostr.tsx') {
        return {
          useNostr: () => ({
            contacts: ['a1'],
            subscribe: (filters, _cb) => {
              calls.push(filters);
              return () => {};
            },
          }),
        };
      }
      if (p === './src/components/NoteCard.tsx') {
        return { NoteCard: () => React.createElement('div') };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    TextDecoder,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'HomeFeed.js' });
  const { HomeFeed } = module.exports;

  await TestRenderer.act(async () => {
    TestRenderer.create(React.createElement(HomeFeed));
    await Promise.resolve();
  });

  assert.strictEqual(calls.length, 1, 'subscribe should be called once');
  const filter = calls[0][0];
  assert.deepStrictEqual(filter.authors, ['a1']);
  assert.deepStrictEqual([...filter.kinds], [1, 6, 30023, 41]);
  assert.strictEqual(filter.limit, 100);

  console.log('All tests passed.');
})();

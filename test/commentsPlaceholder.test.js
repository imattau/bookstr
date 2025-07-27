require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/components/Comments.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: ['react', './src/nostr.tsx'],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const sandbox = {
    require: (p) => {
      if (p === './src/nostr.tsx') {
        return { useNostr: () => ({ subscribe: () => () => {}, publishComment: async () => {}, pubkey: '1' }) };
      }
      if (p.endsWith('DeleteButton') || p.endsWith('DeleteButton.tsx')) {
        return { DeleteButton: () => React.createElement('div') };
      }
      if (p.endsWith('ReportButton') || p.endsWith('ReportButton.tsx')) {
        return { ReportButton: () => React.createElement('div') };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'Comments.js' });
  const { Comments } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(Comments, { bookId: 'book1', events: [] }));
    await Promise.resolve();
  });

  const json = renderer.toJSON();
  const text = JSON.stringify(json);
  assert.ok(text.includes('No comments yet – be the first to reply!'), 'Placeholder text should be present');
  console.log('All tests passed.');
})();

require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/components/BookHistory.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: ['react', './src/nostr.tsx', 'nostr-tools'],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  let publishEvt;
  const sandbox = {
    require: (p) => {
      if (p === './src/nostr.tsx') {
        return {
          useNostr: () => ({
            list: async () => [
              { id: '1', kind: 41, content: 'c1', tags: [['d', 'book']], created_at: 1 },
            ],
            publish: async (evt) => { publishEvt = evt; },
          }),
        };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'BookHistory.js' });
  const { BookHistory } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(BookHistory, { bookId: 'book' }));
    await Promise.resolve();
  });

  await TestRenderer.act(async () => {
    const btn = renderer.root.findAll(
      (n) => n.type === 'button' && n.children.includes('Revert')
    )[0];
    await btn.props.onClick();
    await Promise.resolve();
  });

  assert.ok(publishEvt, 'publish should be called');
  assert.strictEqual(publishEvt.kind, 41);
  assert.strictEqual(publishEvt.content, 'c1');
  console.log('All tests passed.');
})();

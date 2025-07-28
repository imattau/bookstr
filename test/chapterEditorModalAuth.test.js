require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/components/ChapterEditorModal.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: ['react', './src/nostr.tsx', './src/components/ToastProvider.tsx'],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  let published = false;
  let toastMsg;
  const sandbox = {
    require: (p) => {
      if (p === './src/nostr.tsx') {
        return {
          useNostr: () => ({
            publish: async () => { published = true; },
            subscribe: () => () => {},
            pubkey: 'user',
          }),
        };
      }
      if (p === './src/components/ToastProvider.tsx') {
        return { useToast: () => (msg) => { toastMsg = msg; } };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'ChapterEditorModal.js' });
  const { ChapterEditorModal } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(
      React.createElement(ChapterEditorModal, { bookId: '1', chapterNumber: 1, authorPubkey: 'author', onClose: () => {} })
    );
    await Promise.resolve();
  });

  await TestRenderer.act(async () => {
    const btn = renderer.root.findAll(
      (n) => n.type === 'button' && n.children.includes('Save')
    )[0];
    await btn.props.onClick();
    await Promise.resolve();
  });

  assert.strictEqual(published, false, 'publish should not be called');
  assert.ok(toastMsg, 'toast should be shown');
  console.log('All tests passed.');
})();

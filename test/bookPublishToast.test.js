require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/components/BookPublishWizard.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: [
      'react',
      'dompurify',
      'marked',
      './src/nostr.tsx','./src/nostr/events.ts',
      './src/achievements.ts',
      './src/components/ToastProvider.tsx',
    ],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const calls = [];
  const sandbox = {
    require: (p) => {
      if (p === './src/nostr.tsx') {
        return { useNostr: () => ({}) };
      }
      if (p === './src/nostr/events.ts') {
        return { publishLongPost: async () => { throw new Error('fail'); } };
      }
      if (p === './src/achievements.ts') {
        return { reportBookPublished: () => {} };
      }
      if (p === './src/components/ToastProvider.tsx') {
        return { useToast: () => (msg) => calls.push(msg) };
      }
      if (p === 'dompurify') {
        return { __esModule: true, default: { sanitize: (v) => v } };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'BookPublishWizard.js' });
  const { BookPublishWizard } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(BookPublishWizard));
    await Promise.resolve();
  });

  // advance to publish step
  for (let i = 0; i < 4; i++) {
    await TestRenderer.act(async () => {
      const btn = renderer.root.findAll(
        (n) => n.type === 'button' && n.children.includes('Next'),
      )[0];
      btn.props.onClick();
      await Promise.resolve();
    });
  }

  await TestRenderer.act(async () => {
    const publishBtn = renderer.root.findAll(
      (n) => n.type === 'button' && n.children.includes('Publish'),
    )[0];
    await publishBtn.props.onClick();
    await Promise.resolve();
  });

  assert.ok(calls.includes('Failed to publish book.'), 'addToast should be called');
  console.log('All tests passed.');
})();

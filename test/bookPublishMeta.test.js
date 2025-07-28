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
  let metaArgs;
  let onPublishId;
  const sandbox = {
    require: (p) => {
      if (p === './src/nostr.tsx') {
        return { useNostr: () => ({}) };
      }
      if (p === './src/nostr/events.ts') {
        return {
          publishLongPost: async () => ({ id: 'abc123' }),
          publishBookMeta: async (...args) => { metaArgs = args; },
        };
      }
      if (p === './src/achievements.ts') {
        return { reportBookPublished: () => {} };
      }
      if (p === './src/components/ToastProvider.tsx') {
        return { useToast: () => () => {} };
      }
      if (p === 'dompurify') {
        return { __esModule: true, default: { sanitize: (v) => v } };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'BookPublishWizard.js' });
  const { BookPublishWizard } = module.exports;

  const onPublish = (id) => {
    onPublishId = id;
  };

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(BookPublishWizard, { onPublish }));
    await Promise.resolve();
  });

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

  assert.strictEqual(onPublishId, 'abc123');
  assert.strictEqual(metaArgs[1], 'abc123');
  console.log('All tests passed.');
})();

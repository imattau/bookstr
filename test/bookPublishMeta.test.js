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
      '@uiw/*',
      './src/nostr.tsx','./src/nostr/events.ts',
      './src/achievements.ts',
      './src/components/ToastProvider.tsx',
    ],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  let tocArgs;
  let onPublishId;
  let chapterBookId;
  const sandbox = {
    require: (p) => {
      if (p === './src/nostr.tsx') {
        return { useNostr: () => ({}), publishAnnouncement: async () => {} };
      }
      if (p === './src/nostr/events.ts') {
        return {
          publishChapter: async (_ctx, id, num, data) => {
            chapterBookId = id;
            return { id: 'chap1' };
          },
          publishToc: async (...args) => {
            tocArgs = args;
          },
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
      if (p === '@uiw/react-md-editor') {
        return { __esModule: true, default: () => React.createElement('div') };
      }
      if (p === '@uiw/react-markdown-preview') {
        return { __esModule: true, default: () => React.createElement('div') };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    TextDecoder,
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

  assert.strictEqual(onPublishId, chapterBookId);
  assert.strictEqual(tocArgs[1], chapterBookId);
  assert.strictEqual(tocArgs[2][0], 'chap1');
  console.log('All tests passed.');
})();

require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { MemoryRouter, Routes, Route } = require('react-router-dom');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../../src/pages/ManageChapters.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: [
      'react',
      'react-router-dom',
      '@hello-pangea/dnd',
      '../src/nostr.tsx',
      '../src/components/ChapterEditorModal.tsx',
      'nostr-tools',
      '@noble/hashes/utils'
    ],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  let published;
  const sandbox = {
    require: (p) => {
      if (p.includes('nostr')) {
        return {
          useNostr: () => ({
            pubkey: 'author',
            subscribe: (_f, cb) => {
              cb({ id: 'list', kind: 30001, tags: [['e', 'chap1']] });
              cb({ id: 'chap1', kind: 30023, tags: [['title', 'T1']] });
              return () => {};
            },
          }),
        };
      }
      if (p.includes('ChapterEditorModal')) {
        return { ChapterEditorModal: () => React.createElement('div') };
      }
      if (p === '@hello-pangea/dnd') {
        return {
          DragDropContext: ({ children }) => React.createElement('div', null, children),
          Droppable: ({ children }) => React.createElement('div', null, children({ droppableProps: {}, innerRef: () => {}, placeholder: null })),
          Draggable: ({ children }) => React.createElement('div', null, children({ draggableProps: {}, dragHandleProps: {}, innerRef: () => {} })),
        };
      }
      if (p === 'nostr-tools') {
        return { finalizeEvent: (tpl) => ({ ...tpl, id: '1' }) };
      }
      if (p === '@noble/hashes/utils') {
        return { hexToBytes: () => [] };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    React,
    fetch: async (_u, opts) => { published = JSON.parse(opts.body); return { ok: true }; },
  };
  vm.runInNewContext(code, sandbox, { filename: 'ManageChaptersPage.js' });
  const { ManageChaptersPage } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/book/1/chapters'] },
        React.createElement(Routes, null, React.createElement(Route, { path: '/book/:bookId/chapters', element: React.createElement(ManageChaptersPage) }))
      )
    );
    await Promise.resolve();
  });

  await Promise.resolve();

  await TestRenderer.act(async () => {
    const btn = renderer.root.find((n) => n.type === 'button' && n.children.includes('Delete'));
    await btn.props.onClick();
    await Promise.resolve();
  });

  assert.strictEqual(published.kind, 5);
  assert.ok(published.tags.find((t) => t[0] === 'e' && t[1] === 'chap1'));
  console.log('All tests passed.');
})();

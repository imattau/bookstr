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
      '../src/nostr/events.ts',
      '../src/components/ChapterEditorModal.tsx',
      'nostr-tools',
      '@noble/hashes/utils'
    ],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const published = [];
  const sandbox = {
    require: (p) => {
      if (p.includes('nostr')) {
        if (p.includes('events')) {
          return {
            listChapters: async () => ({
              toc: { tags: [['d', '1'], ['e', 'chap1']] },
              chapters: [{ id: 'chap1', tags: [['title', 'T1'], ['summary', '']] }],
            }),
            publishToc: async () => ({ kind: 41 }),
          };
        }
        return {
          useNostr: () => ({ pubkey: 'author' }),
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
    TextDecoder,
    React,
    fetch: async (_u, opts) => {
      published.push(JSON.parse(opts.body));
      return { ok: true };
    },
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

  const del = published.find((e) => e.kind === 5);
  assert.ok(del);
  assert.ok(del.tags.find((t) => t[0] === 'e' && t[1] === 'chap1'));
  console.log('All tests passed.');
})();

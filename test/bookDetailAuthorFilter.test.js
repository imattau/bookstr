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
    entryPoints: [path.join(__dirname, '../src/screens/BookDetailScreen.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: ['react', 'react-router-dom', '@hello-pangea/dnd', './src/nostr.tsx'],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const calls = [];
  const sandbox = {
    require: (p) => {
      if (p === './src/nostr.tsx') {
        return {
          useNostr: () => ({
            subscribe: (filters, cb) => {
              calls.push(filters);
              if (filters[0].kinds && filters[0].kinds.includes(30023)) {
                cb({ id: '1', pubkey: 'author', tags: [], kind: 30023 });
              }
              return () => {};
            },
            publish: async () => {},
            pubkey: 'author',
          }),
        };
      }
      if (p === '@hello-pangea/dnd') {
        return {
          DragDropContext: ({ children }) => React.createElement('div', null, children),
          Droppable: ({ children }) =>
            React.createElement('div', null, children({ droppableProps: {}, innerRef: () => {}, placeholder: null })),
          Draggable: ({ children }) =>
            React.createElement('div', null, children({ draggableProps: {}, dragHandleProps: {}, innerRef: () => {} })),
        };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    TextDecoder,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'BookDetailScreen.js' });
  const { BookDetailScreen } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/book/1'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/book/:bookId', element: React.createElement(BookDetailScreen) })
        )
      )
    );
    await Promise.resolve();
  });

  const hasAuthorFilter = calls.some(
    (f) => f[0].authors && f[0].authors.includes('author')
  );
  assert.ok(hasAuthorFilter, 'subscribe should use authors filter');
  console.log('All tests passed.');
})();

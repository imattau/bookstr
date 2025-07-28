require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { MemoryRouter } = require('react-router-dom');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/screens/BookListScreen.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: ['react', 'react-router-dom', './src/nostr.tsx'],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const sandbox = {
    require: (p) => {
      if (p === './src/nostr.tsx') {
        return { useNostr: () => ({ subscribe: () => () => {}, list: async () => [] }) };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
  };
  vm.runInNewContext(code, sandbox, { filename: 'BookListScreen.js' });
  const { BookListScreen } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(BookListScreen)
      )
    );
    await Promise.resolve();
  });

  const json = renderer.toJSON();
  const text = JSON.stringify(json);
  assert.ok(text.includes('No books found.'), 'Placeholder text should be present');
  console.log('All tests passed.');
})();

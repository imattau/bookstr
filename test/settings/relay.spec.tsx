require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../../src/pages/RelaySettings.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: ['react', '@hello-pangea/dnd', '../src/nostr.tsx'],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  let savedList;
  const sandbox = {
    require: (p) => {
      if (p.includes('nostr')) {
        return { useNostr: () => ({ pubkey: 'pk', saveRelays: (l) => { savedList = l; } }) };
      }
      if (p === '@hello-pangea/dnd') {
        return {
          DragDropContext: ({ children }) => React.createElement('div', null, children),
          Droppable: ({ children }) => React.createElement('div', null, children({ droppableProps: {}, innerRef: () => {}, placeholder: null })),
          Draggable: ({ children }) => React.createElement('div', null, children({ draggableProps: {}, dragHandleProps: {}, innerRef: () => {} })),
        };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'RelaySettingsPage.js' });
  const { RelaySettingsPage } = module.exports;

  const store = {};
  global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  };

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(RelaySettingsPage));
    await Promise.resolve();
  });

  await TestRenderer.act(async () => {
    const input = renderer.root.find((n) => n.props.placeholder === 'wss://relay.example');
    input.props.onChange({ target: { value: 'wss://relay.test' } });
    const btn = renderer.root.find((n) => n.type === 'button' && n.children.includes('Add'));
    btn.props.onClick();
    await Promise.resolve();
  });

  assert.ok(savedList.includes('wss://relay.test'));
  assert.ok(JSON.parse(store['relay-list']).includes('wss://relay.test'));
  console.log('All tests passed.');
})();

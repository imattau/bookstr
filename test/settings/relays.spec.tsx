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
    external: ['react', '../src/nostr.tsx'],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  let saved;
  const sandbox = {
    require: (p) => {
      if (p.includes('nostr.tsx')) {
        return {
          useNostr: () => ({
            relays: ['wss://a'],
            saveRelays: (list) => {
              saved = list;
            },
          }),
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
  vm.runInNewContext(code, sandbox, { filename: 'RelaySettingsPage.js' });
  const { RelaySettingsPage } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(RelaySettingsPage));
    await Promise.resolve();
  });

  const inputs = renderer.root.findAllByType('input');
  const textInput = inputs.find((i) => i.props.placeholder);

  await TestRenderer.act(async () => {
    textInput.props.onChange({ target: { value: 'wss://b' } });
  });
  await TestRenderer.act(async () => {
    const addBtn = renderer.root.find(
      (n) => n.type === 'button' && n.children.includes('Add'),
    );
    await addBtn.props.onClick();
    await Promise.resolve();
  });
  assert.deepStrictEqual(saved, ['wss://a', 'wss://b']);

  await TestRenderer.act(async () => {
    const firstCheckbox = renderer.root.find(
      (n) => n.type === 'input' && n.props.type === 'checkbox',
    );
    firstCheckbox.props.onChange({ target: { checked: false } });
    await Promise.resolve();
  });
  assert.deepStrictEqual(saved, ['wss://a', 'wss://b']);

  await TestRenderer.act(async () => {
    const removeBtn = renderer.root.find(
      (n) => n.type === 'button' && n.children.includes('Remove'),
    );
    await removeBtn.props.onClick();
    await Promise.resolve();
  });
  assert.deepStrictEqual(saved, ['wss://b']);

  console.log('All tests passed.');
})();

require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../../src/pages/DataExport.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: ['react', '../src/nostr.tsx', '../src/components/ToastProvider.tsx'],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const sandbox = {
    require: (p) => {
      if (p.includes('nostr')) return { useNostr: () => ({ sendEvent: async () => {} }) };
      if (p.includes('ToastProvider')) return { useToast: () => () => {} };
      return require(p);
    },
    module,
    exports: module.exports,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'DataExportPage.js' });
  const { DataExportPage } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(DataExportPage));
    await Promise.resolve();
  });

  assert.ok(renderer.toJSON());
  console.log('All tests passed.');
})();

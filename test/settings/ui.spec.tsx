require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../../src/pages/UISettings.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: ['react', '../src/useSettings.ts'],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const sandbox = {
    require: (p) => {
      if (p.includes('useSettings')) return { useSettings: () => ({ theme: 'dark', setTheme: () => {}, yearlyGoal: 1, setYearlyGoal: () => {}, textSize: 14, setTextSize: () => {}, reduceMotion: false, setReduceMotion: () => {} }) };
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    TextDecoder,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'UISettingsPage.js' });
  const { UISettingsPage } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(UISettingsPage));
    await Promise.resolve();
  });

  assert.ok(renderer.toJSON());
  console.log('All tests passed.');
})();

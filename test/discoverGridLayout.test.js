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
    entryPoints: [path.join(__dirname, '../src/components/Discover.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: [
      'react',
      'react-router-dom',
      './src/nostr.tsx',
      './src/components/BookCard.tsx',
      './src/components/BookCardSkeleton.tsx',
      './src/components/OnboardingTooltip.tsx',
      './src/analytics.ts',
      './src/components/CommunityFeed.tsx',
    ],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const sandbox = {
    require: (p) => {
      if (p === './src/nostr.tsx') {
        return { useNostr: () => ({ subscribe: () => () => {}, contacts: [] }) };
      }
      if (p.endsWith('BookCard') || p.endsWith('BookCard.tsx')) {
        return { BookCard: () => React.createElement('div') };
      }
      if (p.endsWith('BookCardSkeleton') || p.endsWith('BookCardSkeleton.tsx')) {
        return { BookCardSkeleton: () => React.createElement('div') };
      }
      if (p.endsWith('OnboardingTooltip') || p.endsWith('OnboardingTooltip.tsx')) {
        return { OnboardingTooltip: ({ children }) => React.createElement('div', null, children) };
      }
      if (p.endsWith('CommunityFeed') || p.endsWith('CommunityFeed.tsx')) {
        return { CommunityFeed: () => React.createElement('div') };
      }
      if (p.endsWith('analytics') || p.endsWith('analytics.ts')) {
        return { logEvent: () => {} };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'Discover.js' });
  const { Discover } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/discover'] },
        React.createElement(Discover)
      )
    );
    await Promise.resolve();
  });

  const grids = renderer.root.findAll(
    (n) => n.type === 'div' && n.props.className && n.props.className.includes('grid-cols-1')
  );
  assert.ok(grids.length >= 3, 'Expected grid containers');
  grids.forEach((g) => {
    const cls = g.props.className;
    assert.ok(cls.includes('md:grid-cols-2'), 'md:grid-cols-2 missing');
    assert.ok(cls.includes('lg:grid-cols-4'), 'lg:grid-cols-4 missing');
  });
  console.log('All tests passed.');
})();

require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/hooks/useDiscoverBooks.ts')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: ['react', './src/nostr.tsx', './src/store/events.ts'],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const sandbox = {
    require: (p) => {
      if (p.includes('nostr.tsx')) {
        return {
          useNostr: () => ({
            contacts: [],
            relays: [],
            subscribe: (filters, cb) => {
              const kinds = (filters[0].kinds || []);
              if (kinds.includes(30023)) {
                cb({ id: '1', kind: 30023, created_at: 1, tags: [['title', 'A']] });
                cb({ id: '2', kind: 30023, created_at: 2, tags: [['title', 'B']] });
              }
              if (kinds.includes(7)) {
                cb({ id: 'v1', kind: 7, content: '+', tags: [['e', '1']] });
                cb({ id: 'v2', kind: 7, content: '+', tags: [['e', '1']] });
                cb({ id: 'v3', kind: 7, content: '+', tags: [['e', '2']] });
              }
              return () => {};
            },
          }),
        };
      }
      if (p.includes('store/events')) {
        return { addEvent: () => {} };
      }
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    TextDecoder,
    React,
    process,
  };
  vm.runInNewContext(code, sandbox, { filename: 'useDiscoverBooks.js' });
  const { useDiscoverBooks } = module.exports;

  let result;
  const TestComp = () => {
    result = useDiscoverBooks();
    return null;
  };

  await TestRenderer.act(async () => {
    TestRenderer.create(React.createElement(TestComp));
  });
  assert.strictEqual(result.loading, true);
  await TestRenderer.act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  assert.strictEqual(result.loading, false);
  assert.strictEqual(result.books.length, 2);
  const trendIds = Array.from(result.trending, (b) => b.id);
  const newIds = Array.from(result.newReleases, (b) => b.id);
  assert.deepStrictEqual(trendIds, ['1', '2']);
  assert.deepStrictEqual(newIds, ['2', '1']);

  await TestRenderer.act(async () => {
    result.removeBook('1');
    await Promise.resolve();
  });
  console.log('All tests passed.');
})();

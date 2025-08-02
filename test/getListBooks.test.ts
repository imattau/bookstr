require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/nostr.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: [
      'react',
      'react-dom',
      'nostr-tools',
      './src/store',
      './src/useSettings',
      './src/nostr/auth',
      './src/lib/keys',
      './src/nostr/offline',
      './src/lib/cache',
      './src/commentUtils',
      '@noble/hashes/utils',
      '@noble/curves/secp256k1',
      '@noble/hashes/sha256',
    ],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };

  const bookmarkEvt = {
    id: 'e1',
    kind: 10003,
    pubkey: 'pk',
    created_at: 0,
    content: '',
    tags: [
      ['a', '41:pk:b1'],
      ['a', '41:pk:b2'],
    ],
  };
  const curationEvt = {
    id: 'e2',
    kind: 30004,
    pubkey: 'pk',
    created_at: 0,
    content: '',
    tags: [['a', '41:pk:b3']],
  };

  class MockPool {
    async list(_relays, filters) {
      if (
        filters.some((f) => (f.kinds || []).includes(10003)) ||
        filters.some((f) => (f.kinds || []).includes(30004))
      ) {
        return [bookmarkEvt, curationEvt];
      }
      return [];
    }
    close() {}
  }

  const sandbox = {
    require: (p) => {
      if (p === 'react') return React;
      if (p === 'react-dom') return { flushSync: (fn) => fn() };
      if (p === 'nostr-tools')
        return { SimplePool: MockPool, getPublicKey: () => '', finalizeEvent: () => ({}) };
      if (p.includes('store'))
        return { useReadingStore: (sel) => sel({ books: {}, loadStatuses: () => {} }), BookStatus: 'want' };
      if (p.includes('useSettings'))
        return { useSettings: (sel) => sel({ textSize: 16, density: 'comfortable', hydrate: () => {} }) };
      if (p.includes('nostr/auth')) return { getPrivKey: () => null, setPrivKey: () => {} };
      if (p.includes('lib/keys'))
        return { loadKey: () => null, importKey: () => '', generateKey: () => '', validatePrivKey: () => true, saveKey: () => {} };
      if (p.includes('nostr/offline')) return { initOfflineSync: () => () => {} };
      if (p.includes('lib/cache')) return { savePointer: () => {}, getPointer: async () => null };
      if (p.includes('commentUtils')) return { buildCommentTags: () => [] };
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    TextDecoder,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'nostr.js' });
  const { NostrProvider, useNostr } = module.exports;

  let ctx;
  const TestComp = () => {
    ctx = useNostr();
    return null;
  };

  await TestRenderer.act(async () => {
    TestRenderer.create(React.createElement(NostrProvider, null, React.createElement(TestComp)));
    await Promise.resolve();
  });

  const result = await ctx.getListBooks('pk');
  assert.deepStrictEqual(result.ids.sort(), ['b1', 'b2', 'b3']);
  assert.strictEqual(result.hasPrivate, false);

  console.log('All tests passed.');
})();

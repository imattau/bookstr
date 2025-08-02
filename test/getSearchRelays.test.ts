require('ts-node/register');
const assert = require('assert');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');
const React = require('react');

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

  let closedRelays;
  class MockPool {
    async list() {
      return [
        {
          id: 'sr',
          kind: 10007,
          pubkey: 'pk',
          created_at: 0,
          content: '',
          tags: [
            ['r', 'wss://one'],
            ['r', 'wss://two'],
          ],
        },
      ];
    }
    close(relays) {
      closedRelays = relays;
    }
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
  const { getSearchRelays } = module.exports;

  const urls = await getSearchRelays('pk');
  assert.deepStrictEqual(urls, ['wss://one', 'wss://two']);
  assert.ok(Array.isArray(closedRelays));

  // no event
  MockPool.prototype.list = async () => [];
  const empty = await getSearchRelays('pk');
  assert.deepStrictEqual(empty, []);

  console.log('All tests passed.');
})();

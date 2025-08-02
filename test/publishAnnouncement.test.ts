require('ts-node/register');
const assert = require('assert');
const React = require('react');
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
  const calls = [];
  const sandbox = {
    require: (p) => {
      if (p === 'react') return React;
      if (p === 'react-dom') return { flushSync: (fn) => fn() };
      if (p === 'nostr-tools') return { SimplePool: class {}, getPublicKey: () => '', finalizeEvent: () => ({}) };
      if (p.includes('store')) return { useReadingStore: (sel) => sel({ books: {}, loadStatuses: () => {} }), BookStatus: 'want' };
      if (p.includes('useSettings')) return { useSettings: (sel) => sel({ textSize: 16, density: 'comfortable', hydrate: () => {} }) };
      if (p.includes('nostr/auth')) return { getPrivKey: () => null, setPrivKey: () => {} };
      if (p.includes('lib/keys')) return { loadKey: () => null, importKey: () => '', generateKey: () => '', validatePrivKey: () => true, saveKey: () => {} };
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
  const { publishAnnouncement } = module.exports;

  const ctx = {
    publish: async (evt) => {
      calls.push(evt);
      return { id: '1', ...evt };
    },
  };

  const result = await publishAnnouncement(ctx, 'hello', [['t', 'x']]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(calls[0])), {
    kind: 1,
    content: 'hello',
    tags: [['t', 'x']],
  });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(result)), {
    id: '1',
    kind: 1,
    content: 'hello',
    tags: [['t', 'x']],
  });

  console.log('All tests passed.');
})();

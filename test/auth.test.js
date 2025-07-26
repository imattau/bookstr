require('ts-node/register');
const assert = require('assert');
const { connectNostrWallet, nostrLogin } = require('../src/nostr/auth');

(async () => {
  // connectNostrWallet returns key
  global.window = { nostr: { getPublicKey: async () => 'npub1' } };
  const key = await connectNostrWallet();
  assert.strictEqual(key, 'npub1');

  // connectNostrWallet handles missing wallet
  global.window = {};
  const noKey = await connectNostrWallet();
  assert.strictEqual(noKey, null);

  // nostrLogin throws when signEvent missing
  await assert.rejects(() => nostrLogin({ sendEvent: async () => {} }, 'npub1'));

  // nostrLogin publishes signed challenge once
  let sendCount = 0;
  let sentEvent;
  const ctx = {
    sendEvent: async (ev) => {
      sendCount++; sentEvent = ev;
    },
    loginNip07: () => {},
  };
  let signEventInput;
  global.window = {
    nostr: {
      signEvent: async (ev) => { signEventInput = ev; return { ...ev, id: '1', sig: 'sig' }; },
    },
  };
  const resKey = await nostrLogin(ctx, 'npub1');
  assert.strictEqual(resKey, 'npub1');
  assert.strictEqual(sendCount, 1);
  assert.deepStrictEqual(sentEvent, { ...signEventInput, id: '1', sig: 'sig' });
  assert.ok(signEventInput.tags.find((t) => t[0] === 'challenge'));

  console.log('All tests passed.');
})();

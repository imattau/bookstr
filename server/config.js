const relays = [
  { url: 'wss://relay.damus.io', supportsNip27: true, retentionDays: 365 },
  { url: 'wss://relay.primal.net', supportsNip27: true, retentionDays: 30 },
  { url: 'wss://nostr.wine', supportsNip27: false, retentionDays: 7 },
];

const prunePolicy = {
  minimumDays: 30,
};

module.exports = { relays, prunePolicy };

/**
 * Configuration for the API server. Each relay entry defines where published
 * events are forwarded and how much history is retained. Only relays that
 * support NIP‑27 and whose `retentionDays` is at least `prunePolicy.minimumDays`
 * will receive events.
 */
const relays = [
  { url: 'wss://relay.damus.io', supportsNip27: true, retentionDays: 365 },
  { url: 'wss://relay.primal.net', supportsNip27: true, retentionDays: 30 },
  { url: 'wss://nostr.wine', supportsNip27: false, retentionDays: 7 },
];

const prunePolicy = {
  minimumDays: 30,
};

module.exports = { relays, prunePolicy };

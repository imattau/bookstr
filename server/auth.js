const { verifyEvent } = require('nostr-tools');

/**
 * Express middleware performing NIP-98 style authentication.
 *
 * Expects an `Authorization` header with scheme `Nostr` followed by a
 * base64-encoded nostr event. The event must:
 *   - be a valid signed event (`verifyEvent`)
 *   - have kind 27235
 *   - contain `u` and `method` tags matching the request
 *   - be recent (created_at within 60 seconds)
 *
 * On success attaches `{ pubkey }` to `req.user`, otherwise responds with 401.
 */
module.exports = function auth(req, res, next) {
  const header = req.get('authorization');
  if (!header) {
    res.status(401).json({ error: 'missing authorization' });
    return;
  }
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Nostr' || !token) {
    res.status(401).json({ error: 'invalid authorization' });
    return;
  }
  let event;
  try {
    const json = Buffer.from(token, 'base64').toString('utf8');
    event = JSON.parse(json);
  } catch (err) {
    res.status(401).json({ error: 'invalid authorization' });
    return;
  }
  if (!verifyEvent(event)) {
    res.status(401).json({ error: 'invalid signature' });
    return;
  }
  if (event.kind !== 27235) {
    res.status(401).json({ error: 'invalid kind' });
    return;
  }
  const urlTag = event.tags.find((t) => t[0] === 'u');
  const methodTag = event.tags.find((t) => t[0] === 'method');
  const expectedUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  if (!urlTag || urlTag[1] !== expectedUrl) {
    res.status(401).json({ error: 'url mismatch' });
    return;
  }
  if (!methodTag || methodTag[1].toUpperCase() !== req.method) {
    res.status(401).json({ error: 'method mismatch' });
    return;
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof event.created_at !== 'number' || Math.abs(now - event.created_at) > 60) {
    res.status(401).json({ error: 'expired' });
    return;
  }
  req.user = { pubkey: event.pubkey };
  next();
};

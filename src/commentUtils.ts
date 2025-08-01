/**
 * Build the Nostr `e`/`p` tag structure for a comment or reply.
 */
export function buildCommentTags(
  bookId: string,
  parentEventId?: string,
  parentPubkey?: string,
) {
  const tags: string[][] = [['e', bookId, '', 'root']];
  if (parentEventId) {
    tags.push(['e', parentEventId, '', 'reply']);
    if (parentPubkey) tags.push(['p', parentPubkey]);
  }
  return tags;
}

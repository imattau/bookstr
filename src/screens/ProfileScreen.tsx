import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { useNostr } from '../nostr';
import { FollowButton } from '../components/FollowButton';
import { BookCard } from '../components/BookCard';
import { addEvent } from '../store/events';

interface ProfileMeta {
  name?: string;
  about?: string;
  picture?: string;
}

export const ProfileScreen: React.FC = () => {
  const { pubkey: loggedPubkey, subscribe, list } = useNostr();
  const params = useParams<{ pubkey?: string }>();
  const pubkey = params.pubkey || loggedPubkey;

  const [meta, setMeta] = useState<ProfileMeta | null>(null);
  const [followers, setFollowers] = useState(0);
  const [books, setBooks] = useState<NostrEvent[]>([]);

  useEffect(() => {
    if (!pubkey) return;
    let off = subscribe(
      [{ kinds: [0], authors: [pubkey], limit: 1 }],
      (evt) => {
        try {
          setMeta(JSON.parse(evt.content));
        } catch {
          setMeta(null);
        }
      },
    );
    return off;
  }, [subscribe, pubkey]);

  useEffect(() => {
    if (!pubkey) return;
    list([{ kinds: [3], '#p': [pubkey] }]).then((evts) => {
      const uniq = new Set<string>();
      evts.forEach((e) => uniq.add(e.pubkey));
      setFollowers(uniq.size);
    });
  }, [list, pubkey]);

  useEffect(() => {
    if (!pubkey) return;
    const filters: Filter[] = [
      { kinds: [30023], authors: [pubkey], limit: 20 },
    ];
    const off = subscribe(filters, (evt) => {
      addEvent(evt);
      setBooks((b) => (b.find((x) => x.id === evt.id) ? b : [...b, evt]));
    });
    return off;
  }, [subscribe, pubkey]);

  if (!pubkey) return null;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        {meta?.picture && (
          <img
            src={meta.picture}
            alt={`Avatar for ${meta?.name || pubkey}`}
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div className="flex-1 space-y-1">
          <h2 className="text-lg font-semibold">{meta?.name || pubkey}</h2>
          {meta?.about && <p className="text-sm text-gray-600">{meta.about}</p>}
          <p className="text-sm text-gray-600">{followers} followers</p>
        </div>
        {pubkey !== loggedPubkey && <FollowButton pubkey={pubkey} />}
      </div>
      <div className="space-y-2">
        {books.map((evt) => (
          <BookCard key={evt.id} event={evt} />
        ))}
        {books.length === 0 && (
          <p className="text-center text-text-muted">No books found.</p>
        )}
      </div>
    </div>
  );
};

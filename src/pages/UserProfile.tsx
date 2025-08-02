import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Event as NostrEvent } from 'nostr-tools';
import { useNostr } from '../nostr';
import { StatsCards } from '../components/StatsCards';
import { BookCard } from '../components/BookCard';
import { fetchUserProfile, followUser } from '../lib/nostr/user';

const UserProfilePage: React.FC = () => {
  const nostr = useNostr();
  const params = useParams<{ pubkey?: string }>();
  const pubkey = params.pubkey || nostr.pubkey;
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile', pubkey],
    queryFn: () => fetchUserProfile(pubkey!),
    enabled: !!pubkey,
  });

  const { data: followers = 0 } = useQuery({
    queryKey: ['followers', pubkey],
    queryFn: async () => {
      const evts = (await nostr.list([
        { kinds: [3], '#p': [pubkey!] },
      ])) as NostrEvent[];
      const uniq = new Set<string>();
      evts.forEach((e) => uniq.add(e.pubkey));
      return uniq.size;
    },
    enabled: !!pubkey,
  });

  const following = pubkey ? nostr.contacts.includes(pubkey) : false;

  const [stats, setStats] = React.useState({
    total: 0,
    finished: 0,
    reading: 0,
    want: 0,
  });

  React.useEffect(() => {
    if (!pubkey) return;
    (async () => {
      try {
        const evts = (await nostr.list([
          { kinds: [30001], authors: [pubkey], '#d': ['library'], limit: 1 },
        ])) as NostrEvent[];
        const library = evts.find((e) =>
          e.tags.some((t) => t[0] === 'd' && t[1] === 'library'),
        );
        const s = { total: 0, finished: 0, reading: 0, want: 0 };
        if (library) {
          library.tags
            .filter((t) => t[0] === 'e')
            .forEach((t) => {
              s.total += 1;
              const status = t[2] || 'want';
              if (status === 'finished') s.finished += 1;
              else if (status === 'reading') s.reading += 1;
              else s.want += 1;
            });
        }
        setStats(s);
      } catch {
        setStats({ total: 0, finished: 0, reading: 0, want: 0 });
      }
    })();
  }, [pubkey, nostr]);

  const [feed, setFeed] = React.useState<NostrEvent[]>([]);
  React.useEffect(() => {
    if (!pubkey) return;
    (async () => {
      try {
        const events = (await nostr.list([
          { kinds: [30023], authors: [pubkey], limit: 20 },
        ])) as NostrEvent[];
        setFeed(events);
      } catch {
        setFeed([]);
      }
    })();
  }, [pubkey, nostr]);

  if (!pubkey) return null;

  const handleFollow = async () => {
    const nowFollowing = await followUser(nostr, pubkey);
    queryClient.setQueryData<number>(
      ['followers', pubkey],
      (old = 0) => (nowFollowing ? old + 1 : Math.max(0, old - 1)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        {profile?.picture && (
          <img
            src={profile.picture}
            alt={`Avatar for ${profile?.name || pubkey}`}
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div className="flex-1 space-y-1">
          <h2 className="text-xl font-semibold">{profile?.name || pubkey}</h2>
          {profile?.about && (
            <p className="text-sm text-text-muted">{profile.about}</p>
          )}
          <p className="text-sm text-text-muted">{followers} followers</p>
        </div>
        {pubkey !== nostr.pubkey && (
          <button
            onClick={handleFollow}
            className="rounded bg-[color:var(--clr-primary-600)] px-2 py-1 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
          >
            {following ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>
      <StatsCards
        total={stats.total}
        finished={stats.finished}
        reading={stats.reading}
        want={stats.want}
      />
      <div className="space-y-2">
        <h3 className="font-semibold">Activity</h3>
        <ul role="list" className="space-y-4">
          {feed.map((evt) => (
            <li key={evt.id} role="listitem">
              <BookCard event={evt} />
            </li>
          ))}
          {feed.length === 0 && (
            <p className="text-center text-text-muted">No activity.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default UserProfilePage;


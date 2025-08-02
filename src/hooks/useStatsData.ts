import { useEffect, useState } from 'react';
import type { Event as NostrEvent } from 'nostr-tools';
import { useNostr } from '../nostr';

export interface StatsData {
  total: number;
  finished: number;
  reading: number;
  want: number;
  ratings: Record<number, number>;
}

const initialRatings: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

/**
 * Hook fetching reading history and rating distribution from the user's
 * Nostr lists.
 */
export function useStatsData(): StatsData {
  const { pubkey, list } = useNostr();
  const [data, setData] = useState<StatsData>({
    total: 0,
    finished: 0,
    reading: 0,
    want: 0,
    ratings: initialRatings,
  });

  useEffect(() => {
    if (!pubkey) return;
    (async () => {
      try {
        const evts = (await list([
          { kinds: [30001], authors: [pubkey], '#d': ['library'], limit: 1 },
          { kinds: [30001], authors: [pubkey], '#d': ['ratings'], limit: 1 },
        ])) as NostrEvent[];
        const library = evts.find((e) =>
          e.tags.some((t) => t[0] === 'd' && t[1] === 'library'),
        );
        const ratingsEvt = evts.find((e) =>
          e.tags.some((t) => t[0] === 'd' && t[1] === 'ratings'),
        );
        const stats = { total: 0, finished: 0, reading: 0, want: 0 };
        const ratings = { ...initialRatings };
        if (library) {
          library.tags
            .filter((t) => t[0] === 'e')
            .forEach((t) => {
              stats.total += 1;
              const status = t[2] || 'want';
              if (status === 'finished') stats.finished += 1;
              else if (status === 'reading') stats.reading += 1;
              else stats.want += 1;
            });
        }
        if (ratingsEvt) {
          ratingsEvt.tags
            .filter((t) => t[0] === 'e')
            .forEach((t) => {
              const rating = parseInt(t[2] || '', 10);
              if (rating >= 1 && rating <= 5) ratings[rating] += 1;
            });
        }
        setData({ ...stats, ratings });
      } catch {
        setData({ total: 0, finished: 0, reading: 0, want: 0, ratings: initialRatings });
      }
    })();
  }, [pubkey, list]);

  return data;
}

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNostr } from '../nostr';
import { publishVote, publishFavourite } from '../nostr/events';
import type { Event as NostrEvent } from 'nostr-tools';

interface ReactionState {
  count: number;
  active: boolean;
}

interface ReactionContextValue {
  reactToContent: (
    target: string,
    type: 'vote' | 'favourite',
  ) => Promise<void>;
}

const ReactionContext = createContext<ReactionContextValue | undefined>(
  undefined,
);

export const useReactionContext = () => {
  const ctx = useContext(ReactionContext);
  if (!ctx) throw new Error('useReactionContext must be used within ReactionProvider');
  return ctx;
};

const queryClient = new QueryClient();

export const ReactionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const nostr = useNostr();

  const reactToContent = useCallback(
    async (target: string, type: 'vote' | 'favourite') => {
      if (type === 'vote') {
        await publishVote(nostr, target);
      } else {
        await publishFavourite(nostr, target);
      }
      queryClient.invalidateQueries({ queryKey: ['reaction', type, target] });
    },
    [nostr],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ReactionContext.Provider value={{ reactToContent }}>
        {children}
      </ReactionContext.Provider>
    </QueryClientProvider>
  );
};

export function useReactions(target: string, type: 'vote' | 'favourite') {
  const nostr = useNostr();
  const queryClient = useQueryClient();
  const idsRef = useRef<Set<string>>(new Set());
  const symbol = type === 'vote' ? '+' : '★';

  const query = useQuery<ReactionState>({
    queryKey: ['reaction', type, target],
    queryFn: async () => {
      const events = await nostr.list([{ kinds: [7], '#e': [target] }]);
      const ids = new Set<string>();
      let count = 0;
      let active = false;
      for (const evt of events as NostrEvent[]) {
        if (evt.content === symbol && !ids.has(evt.id)) {
          ids.add(evt.id);
          count++;
          if (evt.pubkey === nostr.pubkey) active = true;
        }
      }
      idsRef.current = ids;
      return { count, active };
    },
    initialData: { count: 0, active: false },
  });

  useEffect(() => {
    const off = nostr.subscribe([{ kinds: [7], '#e': [target] }], (evt: NostrEvent) => {
      if (evt.content === symbol && !idsRef.current.has(evt.id)) {
        idsRef.current.add(evt.id);
        queryClient.setQueryData<ReactionState>(
          ['reaction', type, target],
          (old) => ({
            count: (old?.count ?? 0) + 1,
            active: old?.active || evt.pubkey === nostr.pubkey,
          }),
        );
      }
    });
    return off;
  }, [nostr, target, type, queryClient, symbol]);

  return query;
}


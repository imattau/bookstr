import React from 'react';
import { Skeleton, TextSkeleton } from './Skeleton';

/**
 * Placeholder skeleton displayed while book content loads.
 */
export const BookCardSkeleton: React.FC = () => (
  <div className="rounded-[var(--radius-card)] border p-[var(--space-2)] xl:p-[var(--space-1)] space-y-[var(--space-2)]">
    <Skeleton className="h-32 w-24 xl:h-28 xl:w-20" />
    <TextSkeleton lines={1} className="w-3/4" />
    <TextSkeleton lines={1} />
    <div className="pt-2 flex gap-2">
      <Skeleton className="h-6 w-16 rounded" />
      <Skeleton className="h-6 w-8 rounded" />
    </div>
  </div>
);

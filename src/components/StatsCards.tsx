import React from 'react';

export interface StatsCardsProps {
  total: number;
  finished: number;
  reading: number;
  want: number;
}

/**
 * Displays summary cards for reading stats.
 */
export const StatsCards: React.FC<StatsCardsProps> = ({
  total,
  finished,
  reading,
  want,
}) => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
    <div className="rounded border p-4 text-center">
      <p className="text-2xl font-semibold">{total}</p>
      <p className="text-sm text-text-muted">Total</p>
    </div>
    <div className="rounded border p-4 text-center">
      <p className="text-2xl font-semibold">{finished}</p>
      <p className="text-sm text-text-muted">Finished</p>
    </div>
    <div className="rounded border p-4 text-center">
      <p className="text-2xl font-semibold">{reading}</p>
      <p className="text-sm text-text-muted">Reading</p>
    </div>
    <div className="rounded border p-4 text-center">
      <p className="text-2xl font-semibold">{want}</p>
      <p className="text-sm text-text-muted">Want to Read</p>
    </div>
  </div>
);

import React from 'react';

interface StatusChartProps {
  finished: number;
  reading: number;
  want: number;
}

export const StatusChart: React.FC<StatusChartProps> = ({ finished, reading, want }) => {
  const total = finished + reading + want;
  const makeWidth = (n: number) => `${total ? (n / total) * 100 : 0}%`;
  return (
    <div className="space-y-2">
      {[['Finished', finished], ['Reading', reading], ['Want', want]].map(([label, value]) => (
        <div key={label as string} className="flex items-center gap-2">
          <span className="w-16 text-sm">{label}</span>
          <div className="flex-1 h-2 rounded bg-gray-200">
            <div
              className="h-2 rounded bg-[color:var(--clr-primary-600)]"
              style={{ width: makeWidth(value as number) }}
            />
          </div>
          <span className="w-8 text-right text-sm">{value as number}</span>
        </div>
      ))}
    </div>
  );
};

interface RatingChartProps {
  ratings: Record<number, number>;
  total: number;
}

export const RatingChart: React.FC<RatingChartProps> = ({ ratings, total }) => {
  const makeWidth = (n: number) => `${total ? (n / total) * 100 : 0}%`;
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((r) => (
        <div key={r} className="flex items-center gap-2">
          <span className="w-16 text-sm">{r}★</span>
          <div className="flex-1 h-2 rounded bg-gray-200">
            <div
              className="h-2 rounded bg-[color:var(--clr-primary-600)]"
              style={{ width: makeWidth(ratings[r] || 0) }}
            />
          </div>
          <span className="w-8 text-right text-sm">{ratings[r] || 0}</span>
        </div>
      ))}
    </div>
  );
};

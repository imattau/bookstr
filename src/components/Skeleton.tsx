import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`skeleton ${className}`} {...props} />
  ),
);
Skeleton.displayName = 'Skeleton';

export const TextSkeleton: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { lines?: number }
> = ({ lines = 1, className = '', ...props }) => (
  <div className={className} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="skeleton mb-[var(--space-1)] h-4 w-full last:mb-0" />
    ))}
  </div>
);

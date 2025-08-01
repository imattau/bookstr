import React from 'react';

export interface ProgressBarProps {
  value: number;
  'aria-label'?: string;
  className?: string;
  'data-testid'?: string;
}

/**
 * Horizontal progress bar showing completion percentage.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  'aria-label': ariaLabel,
  className,
  'data-testid': dataTestId,
}) => (
  <div
    role="progressbar"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label={ariaLabel}
    className={`h-2 w-full overflow-hidden rounded bg-border ${className ?? ''}`}
    data-testid={dataTestId}
  >
    <div className="h-full bg-[color:var(--clr-primary-600)]" style={{ width: `${value}%` }} />
  </div>
);

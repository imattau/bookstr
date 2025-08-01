import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
}

/**
 * Styled button supporting primary and outline variants.
 */
export const Button: React.FC<ButtonProps> = ({ variant = 'outline', className, ...props }) => (
  <button
    {...props}
    className={`rounded-[var(--radius-button)] px-[var(--space-3)] py-[var(--space-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50 ${
      variant === 'primary'
        ? 'bg-[color:var(--clr-primary-600)] text-white'
        : 'border'
    } ${className ?? ''}`}
  />
);

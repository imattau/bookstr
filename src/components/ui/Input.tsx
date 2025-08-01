import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Basic styled text input element.
 */
export const Input: React.FC<InputProps> = ({ className, ...props }) => (
  <input
    {...props}
    className={`w-full rounded border p-[var(--space-2)] ${className ?? ''}`}
  />
);

import React from 'react';

export interface ModalProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

/**
 * Simple modal overlay that closes on outside click.
 */
export const Modal: React.FC<ModalProps> = ({ children, className, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-[var(--space-2)] sm:p-[var(--space-4)]"
    onClick={onClose}
  >
    <div
      className={`w-full max-w-sm max-h-screen overflow-y-auto rounded-modal bg-[color:var(--clr-surface)] p-[var(--space-4)] ${className ?? ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

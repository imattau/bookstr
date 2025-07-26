import React, { useEffect, useRef } from 'react';

export interface ReaderViewProps {
  bookId: string;
  html: string;
  scrollSync?: boolean;
  initialPercent?: number;
  onPercentChange?: (pct: number) => void;
  onFinish?: () => void;
  className?: string;
  'data-testid'?: string;
}

function calcPercent(el: HTMLElement) {
  const max = el.scrollHeight - el.clientHeight;
  if (max <= 0) return 100;
  return Math.min(100, Math.max(0, (el.scrollTop / max) * 100));
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  html,
  scrollSync = true,
  initialPercent = 0,
  onPercentChange,
  onFinish,
  className,
  'data-testid': dataTestId,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollTop =
      (ref.current.scrollHeight - ref.current.clientHeight) *
      (initialPercent / 100);
  }, [initialPercent]);

  useEffect(() => {
    if (!scrollSync || !ref.current) return;
    let ticking = false;
    const el = ref.current;
    const handle = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const pct = calcPercent(el);
          onPercentChange?.(pct);
          if (pct >= 100) onFinish?.();
          ticking = false;
        });
        ticking = true;
      }
    };
    el.addEventListener('scroll', handle);
    return () => el.removeEventListener('scroll', handle);
  }, [scrollSync, onPercentChange, onFinish]);

  return (
    <div
      ref={ref}
      className={`overflow-y-auto p-4 ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
      data-testid={dataTestId}
    />
  );
};

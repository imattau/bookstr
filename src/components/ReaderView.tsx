import React, { useEffect, useRef, useState } from 'react';
import { cacheBookHtml, getCachedBookHtml } from '../htmlCache';
import { saveOfflineBook } from '../offlineStore';
import { logEvent } from '../analytics';

export interface ReaderViewProps {
  bookId: string;
  html: string;
  scrollSync?: boolean;
  initialPercent?: number;
  onPercentChange?: (pct: number) => void;
  onFinish?: () => void;
  style?: React.CSSProperties;
  className?: string;
  'data-testid'?: string;
}

function calcPercent(el: HTMLElement) {
  const max = el.scrollHeight - el.clientHeight;
  if (max <= 0) return 100;
  return Math.min(100, Math.max(0, (el.scrollTop / max) * 100));
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  bookId,
  html,
  scrollSync = true,
  initialPercent = 0,
  onPercentChange,
  onFinish,
  style,
  className,
  'data-testid': dataTestId,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(html);

  useEffect(() => {
    setContent(html);
    if (html) {
      cacheBookHtml(bookId, html);
      saveOfflineBook(bookId, html);
    }
  }, [bookId, html]);

  useEffect(() => {
    logEvent('reader_open', { bookId });
  }, [bookId]);

  useEffect(() => {
    if (!navigator.onLine && !html) {
      getCachedBookHtml(bookId).then((cached) => {
        if (cached) setContent(cached);
      });
    }
  }, [bookId, html]);

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
          if (pct >= 100) {
            logEvent('reader_finish', { bookId });
            onFinish?.();
          }
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
      style={style}
      dangerouslySetInnerHTML={{ __html: content }}
      data-testid={dataTestId}
    />
  );
};

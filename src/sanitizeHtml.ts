import DOMPurify, { Config } from 'dompurify';

export const SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: [
    'a',
    'b',
    'i',
    'em',
    'strong',
    'p',
    'ul',
    'ol',
    'li',
    'pre',
    'code',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'img',
    'hr',
    'br',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'rel', 'target'],
};

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

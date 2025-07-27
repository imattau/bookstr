export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidNip05(handle: string): boolean {
  const [name, domain] = handle.split('@');
  if (!name || !domain) return false;
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return false;
  if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) return false;
  return true;
}

export function isValidWsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'ws:' || u.protocol === 'wss:';
  } catch {
    return false;
  }
}

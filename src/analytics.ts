export async function logEvent(name: string, params: Record<string, unknown> = {}): Promise<void> {
  try {
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('event', name, params);
    } else {
      await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, params }),
        keepalive: true,
      });
    }
  } catch {
    // ignore analytics errors
  }
}

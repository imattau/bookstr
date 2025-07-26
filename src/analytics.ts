interface EventRecord {
  name: string;
  params: Record<string, unknown>;
  ts: number;
}

export async function logEvent(
  name: string,
  params: Record<string, unknown> = {},
): Promise<void> {
  const record: EventRecord = { name, params, ts: Date.now() };

  try {
    await fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
      keepalive: true,
    });
  } catch {
    // network failed, fall through to localStorage
  }

  try {
    const stored = localStorage.getItem('analytics_events');
    const events: EventRecord[] = stored ? JSON.parse(stored) : [];
    events.push(record);
    if (events.length > 100) events.shift();
    localStorage.setItem('analytics_events', JSON.stringify(events));
  } catch {
    // ignore storage errors
  }
}

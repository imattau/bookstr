export async function queueAction(action: Record<string, any>): Promise<void> {
  try {
    await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });
  } catch {
    // errors are handled by BackgroundSync via service worker
  }
}


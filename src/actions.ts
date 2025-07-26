const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';

export async function queueAction(action: Record<string, any>): Promise<void> {
  try {
    await fetch(`${API_BASE}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });
  } catch {
    // errors are handled by BackgroundSync via service worker
  }
}


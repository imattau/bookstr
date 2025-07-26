const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';
const PUBLIC_KEY = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64Safe);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function registerPushSubscription(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return;
  const reg = await navigator.serviceWorker.ready;
  await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: PUBLIC_KEY
      ? urlBase64ToUint8Array(PUBLIC_KEY)
      : undefined,
  });
  try {
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch(`${API_BASE}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
    }
  } catch {
    /* ignore network errors */
  }
}

export async function unregisterPushSubscription(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  try {
    await fetch(`${API_BASE}/subscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    });
  } catch {
    /* ignore */
  }
  await sub.unsubscribe();
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window))
    return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

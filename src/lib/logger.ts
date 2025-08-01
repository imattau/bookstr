export function logError(err: unknown): void {
  console.error(err);
  try {
    const { logEvent } = require('../analytics');
    if (logEvent) {
      const message = err instanceof Error ? err.message : String(err);
      logEvent('error', { message });
    }
  } catch {
    /* ignore analytics errors */
  }
}

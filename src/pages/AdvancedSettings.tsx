import React from 'react';
import { useSettings } from '../useSettings';
import { useEventStore } from '../store/events';
import { useNostr, setMaxEventSize, MAX_EVENT_SIZE } from '../nostr';
import { useToast } from '../components/ToastProvider';

const AdvancedSettingsPage: React.FC = () => {
  const advancedMode = useSettings((s) => s.advancedMode);
  const setAdvancedMode = useSettings((s) => s.setAdvancedMode);
  const storeMax = useSettings((s) => s.maxEventSize);
  const setStoreMax = useSettings((s) => s.setMaxEventSize);
  const [maxSize, setMaxSize] = React.useState(
    () => storeMax || MAX_EVENT_SIZE,
  );

  const { sendEvent } = useNostr();
  const events = useEventStore((s) => Object.values(s.events));
  const toast = useToast();

  const relayLogs = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('relay_logs') || '[]');
    } catch {
      return [] as any[];
    }
  }, [advancedMode]);

  const handleClearLogs = () => {
    localStorage.removeItem('relay_logs');
  };

  const handleRebroadcast = async () => {
    for (const evt of events) {
      try {
        await sendEvent(evt);
      } catch {
        /* ignore individual errors */
      }
    }
    toast('Re-broadcast complete');
  };

  const handleSaveSize = () => {
    const size = Math.max(100, maxSize);
    setStoreMax(size);
    setMaxEventSize(size);
  };

  const version = (import.meta as any).env?.VITE_APP_VERSION || '';
  const sha = (import.meta as any).env?.VITE_COMMIT_SHA || '';
  const buildDate = (import.meta as any).env?.VITE_BUILD_DATE || '';

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={advancedMode}
          onChange={(e) => setAdvancedMode(e.target.checked)}
        />
        Advanced mode
      </label>
      {advancedMode && (
        <div className="space-y-4">
          <div>
            <h2 className="mb-1 text-sm font-medium">Relay logs</h2>
            {relayLogs.length > 0 ? (
              <pre className="max-h-48 overflow-y-auto rounded border p-2 text-xs whitespace-pre-wrap break-all">
                {JSON.stringify(relayLogs, null, 2)}
              </pre>
            ) : (
              <p className="text-sm">No logs</p>
            )}
            <button
              onClick={handleClearLogs}
              className="mt-2 rounded border px-3 py-1"
            >
              Clear Logs
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={handleRebroadcast}
              className="rounded border px-3 py-1"
            >
              Re-broadcast my events
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium">
              Max event size (bytes)
            </label>
            <input
              type="number"
              min={100}
              value={maxSize}
              onChange={(e) => setMaxSize(parseInt(e.target.value, 10) || 100)}
              className="w-full rounded border p-2"
            />
            <button
              onClick={handleSaveSize}
              className="mt-2 rounded border px-3 py-1"
            >
              Save
            </button>
          </div>
        </div>
      )}
      <div className="text-sm text-gray-600 space-y-1">
        <p>Version: {version}</p>
        <p>Commit: {sha}</p>
        <p>Built: {buildDate}</p>
      </div>
    </div>
  );
};

export default AdvancedSettingsPage;

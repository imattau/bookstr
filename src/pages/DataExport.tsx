import React from 'react';
import { useNostr } from '../nostr';
import { useEventStore, addEvent } from '../store/events';
import { getOfflineEdits, queueOfflineEdit } from '../lib/offlineSync';
import { useToast } from '../components/ToastProvider';

const DataExportPage: React.FC = () => {
  const { sendEvent } = useNostr();
  const toast = useToast();
  const [includeLogs, setIncludeLogs] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const events = useEventStore((s) => Object.values(s.events));

  const handleExport = async () => {
    const edits = await getOfflineEdits();
    let logs: any[] = [];
    if (includeLogs) {
      try {
        logs = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      } catch {
        logs = [];
      }
    }
    const data = { events, offlineEdits: edits, logs };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookstr-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data.events)) {
        for (const evt of data.events) {
          try {
            await sendEvent(evt);
          } catch {}
          addEvent(evt as any);
        }
      }
      if (Array.isArray(data.offlineEdits)) {
        for (const edit of data.offlineEdits) {
          await queueOfflineEdit(edit);
        }
      }
      if (Array.isArray(data.logs)) {
        localStorage.setItem('analytics_events', JSON.stringify(data.logs));
      }
      toast('Import complete');
    } catch {
      toast('Import failed', { type: 'error' });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeLogs}
            onChange={(e) => setIncludeLogs(e.target.checked)}
          />
          Include logs
        </label>
        <button onClick={handleExport} className="rounded border px-3 py-1">
          Export my data
        </button>
      </div>
      <div className="space-y-2">
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded border px-3 py-1"
        >
          Import data
        </button>
      </div>
    </div>
  );
};

export default DataExportPage;

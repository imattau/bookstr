/**
 * Configure offline behaviour including caching and background sync.
 *
 * Uses helper functions from `offlineStore` to query and update offline state.
 */
import React from 'react';
import {
  clearOfflineBooks,
  getCacheSize,
  getLastSynced,
  isBackgroundSync,
  isOfflineMode,
  setBackgroundSync,
  setOfflineMode,
} from '../offlineStore';

const OfflineSettingsPage: React.FC = () => {
  const [cacheSize, setCacheSize] = React.useState<number>(0);
  const [lastSynced, setLastSynced] = React.useState<number | null>(null);
  const [offlineMode, setOfflineModeState] = React.useState<boolean>(true);
  const [bgSync, setBgSyncState] = React.useState<boolean>(true);

  React.useEffect(() => {
    getCacheSize().then(setCacheSize);
    getLastSynced().then(setLastSynced);
    isOfflineMode().then(setOfflineModeState);
    isBackgroundSync().then(setBgSyncState);
  }, []);

  const handleClear = async () => {
    await clearOfflineBooks();
    setCacheSize(0);
    setLastSynced(Date.now());
  };

  const toggleOffline = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setOfflineModeState(val);
    await setOfflineMode(val);
  };

  const toggleBgSync = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setBgSyncState(val);
    await setBackgroundSync(val);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={offlineMode} onChange={toggleOffline} />
          Offline mode
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={bgSync} onChange={toggleBgSync} />
          Background sync
        </label>
      </div>
      <div className="space-y-1 text-sm">
        <p>Cache size: {(cacheSize / 1024).toFixed(1)} kB</p>
        {lastSynced && (
          <p>Last synced: {new Date(lastSynced).toLocaleString()}</p>
        )}
        <button onClick={handleClear} className="rounded border px-3 py-1 mt-[var(--space-2)]">
          Clear Cached Books
        </button>
      </div>
    </div>
  );
};

export default OfflineSettingsPage;

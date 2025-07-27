import React from 'react';
import { useNostr, verifyNip05 } from '../nostr';
import { LoginButton } from './LoginButton';
import { useWallet } from '../WalletConnect';
import { ContactsManager } from './ContactsManager';
import { RelayListManager } from './RelayListManager';
import { DelegationManager } from './DelegationManager';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useReadingStore } from '../store';
import {
  useAchievements,
  ACHIEVEMENT_LABELS,
  AchievementId,
} from '../achievements';
import { FaPen, FaTrophy } from 'react-icons/fa';
import {
  getOfflineBooks,
  saveOfflineBook,
  removeOfflineBook,
  clearOfflineBooks,
  pruneOfflineBooks,
  type OfflineBook,
} from '../offlineStore';
import { useSettings } from '../useSettings';
import {
  registerPushSubscription,
  unregisterPushSubscription,
  isPushSubscribed,
} from '../push';
import { isValidUrl, isValidNip05 } from '../validators';

interface ProfileMeta {
  [key: string]: unknown;
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  lud16?: string;
}

export const ProfileSettings: React.FC = () => {
  const { metadata, saveProfile, pubkey } = useNostr();
  const { connected, connect } = useWallet();
  const [form, setForm] = React.useState<ProfileMeta>(() => ({
    name: (metadata as ProfileMeta | null)?.name ?? '',
    about: (metadata as ProfileMeta | null)?.about ?? '',
    picture: (metadata as ProfileMeta | null)?.picture ?? '',
    nip05: (metadata as ProfileMeta | null)?.nip05 ?? '',
    lud16: (metadata as ProfileMeta | null)?.lud16 ?? '',
  }));
  const [verified, setVerified] = React.useState<boolean | null>(null);

  const { books, yearlyGoal, setYearlyGoal } = useReadingStore();
  const { unlocked } = useAchievements();
  const iconMap: Record<AchievementId, JSX.Element> = {
    'first-publish': <FaPen />,
    'five-finished': <FaTrophy />,
  };
  const offlineMaxBooks = useSettings((s) => s.offlineMaxBooks);
  const setOfflineMaxBooks = useSettings((s) => s.setOfflineMaxBooks);
  const pushEnabled = useSettings((s) => s.pushEnabled);
  const setPushEnabled = useSettings((s) => s.setPushEnabled);
  const [offlineBooks, setOfflineBooks] = React.useState<OfflineBook[]>([]);
  const [errors, setErrors] = React.useState<{
    picture?: string;
    nip05?: string;
  }>({});
  const [touched, setTouched] = React.useState<{
    picture?: boolean;
    nip05?: boolean;
  }>({});

  React.useEffect(() => {
    getOfflineBooks().then(setOfflineBooks);
  }, []);

  React.useEffect(() => {
    isPushSubscribed()
      .then(setPushEnabled)
      .catch(() => {});
  }, [setPushEnabled]);

  const toggleOffline = async (id: string) => {
    if (offlineBooks.find((b) => b.id === id)) {
      await removeOfflineBook(id);
    } else {
      try {
        const res = await fetch(`/book/${id}`);
        if (res.ok) {
          const html = await res.text();
          await saveOfflineBook(id, html);
        }
      } catch {
        // ignore fetch errors
      }
    }
    setOfflineBooks(await getOfflineBooks());
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'refresh-offline',
      });
    }
  };

  const handleClearOffline = async () => {
    await clearOfflineBooks();
    setOfflineBooks([]);
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'refresh-offline',
      });
    }
  };

  const handleMaxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
    setOfflineMaxBooks(val);
    await pruneOfflineBooks(val);
    setOfflineBooks(await getOfflineBooks());
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'refresh-offline',
      });
    }
  };

  const handlePushToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    if (val) await registerPushSubscription();
    else await unregisterPushSubscription();
    setPushEnabled(val);
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
    setYearlyGoal(val);
  };

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'picture' && value) {
      if (!isValidUrl(value)) error = 'Invalid URL';
    }
    if (name === 'nip05' && value) {
      if (!isValidNip05(value)) error = 'Invalid NIP-05';
    }
    setErrors((e) => ({ ...e, [name]: error }));
  };

  React.useEffect(() => {
    validateField('picture', form.picture ?? '');
    validateField('nip05', form.nip05 ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pubkey) {
    return (
      <div className="p-4">
        <LoginButton />
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === 'picture' || name === 'nip05') {
      validateField(name, value);
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === 'picture' || name === 'nip05') {
      setTouched((t) => ({ ...t, [name]: true }));
      validateField(name, value);
    }
  };

  const handleSave = async () => {
    await saveProfile(form);
    if (form.nip05 && pubkey) {
      setVerified(await verifyNip05(form.nip05, pubkey));
    }
  };

  const isFormValid = !errors.picture && !errors.nip05;

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full rounded border p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Bio</label>
        <textarea
          name="about"
          value={form.about}
          onChange={handleChange}
          className="w-full rounded border p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Avatar URL</label>
        <input
          name="picture"
          value={form.picture}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full rounded border p-2"
        />
        {touched.picture && errors.picture && (
          <p className="text-red-600 text-sm">{errors.picture}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium">NIP-05</label>
        <input
          name="nip05"
          value={form.nip05}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full rounded border p-2"
        />
        {touched.nip05 && errors.nip05 && (
          <p className="text-red-600 text-sm">{errors.nip05}</p>
        )}
        {verified !== null && (
          <p className="text-sm">{verified ? 'Verified ✔' : 'Unverified'}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium">Lightning (lud16)</label>
        <input
          name="lud16"
          value={form.lud16}
          onChange={handleChange}
          className="w-full rounded border p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Theme</label>
        <ThemeSwitcher />
      </div>
      <div>
        <label className="block text-sm font-medium">Yearly reading goal</label>
        <input
          type="number"
          min={1}
          value={yearlyGoal}
          onChange={handleGoalChange}
          className="w-full rounded border p-2"
        />
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={pushEnabled}
            onChange={handlePushToggle}
          />
          Enable push notifications
        </label>
      </div>
      {unlocked.length > 0 && (
        <div className="pt-4">
          <h2 className="mb-2 text-sm font-medium">Achievements</h2>
          <div className="flex gap-2">
            {unlocked.map((id) => (
              <span
                key={id}
                title={ACHIEVEMENT_LABELS[id]}
                className="text-primary-600 text-lg"
              >
                {iconMap[id]}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="pt-4">
        <h2 className="mb-2 text-sm font-medium">Offline content</h2>
        <div className="mb-2">
          <label className="block text-sm font-medium">Max offline books</label>
          <input
            type="number"
            min={1}
            value={offlineMaxBooks}
            onChange={handleMaxChange}
            className="w-full rounded border p-2"
          />
        </div>
        <div className="mb-2 space-y-1">
          {books.map((b) => (
            <label key={b.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={offlineBooks.some((o) => o.id === b.id)}
                onChange={() => toggleOffline(b.id)}
              />
              {b.title}
            </label>
          ))}
        </div>
        <button
          onClick={handleClearOffline}
          className="rounded bg-primary-600 px-4 py-1 text-white"
        >
          Clear Cached Books
        </button>
      </div>
      <button
        onClick={handleSave}
        disabled={!isFormValid}
        className="rounded bg-primary-600 px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
      >
        Save
      </button>
      <button
        onClick={connect}
        className="rounded bg-primary-600 px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
      >
        {connected ? 'Wallet Connected' : 'Connect Wallet'}
      </button>
      <div className="pt-4">
        <h2 className="mb-2 text-sm font-medium">Following</h2>
        <ContactsManager />
      </div>
      <div className="pt-4">
        <h2 className="mb-2 text-sm font-medium">Relays</h2>
        <RelayListManager />
      </div>
      <div className="pt-4">
        <h2 className="mb-2 text-sm font-medium">Delegations</h2>
        <DelegationManager />
      </div>
    </div>
  );
};

import React from 'react';
import { useNostr, verifyNip05 } from '../nostr';

interface ProfileMeta {
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  lud16?: string;
}

export const ProfileSettings: React.FC = () => {
  const { metadata, saveProfile, pubkey } = useNostr();
  const [form, setForm] = React.useState<ProfileMeta>(() => ({
    name: (metadata as ProfileMeta | null)?.name ?? '',
    about: (metadata as ProfileMeta | null)?.about ?? '',
    picture: (metadata as ProfileMeta | null)?.picture ?? '',
    nip05: (metadata as ProfileMeta | null)?.nip05 ?? '',
    lud16: (metadata as ProfileMeta | null)?.lud16 ?? '',
  }));
  const [verified, setVerified] = React.useState<boolean | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    await saveProfile(form);
    if (form.nip05 && pubkey) {
      setVerified(await verifyNip05(form.nip05, pubkey));
    }
  };

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
          className="w-full rounded border p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">NIP-05</label>
        <input
          name="nip05"
          value={form.nip05}
          onChange={handleChange}
          className="w-full rounded border p-2"
        />
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
      <button
        onClick={handleSave}
        className="rounded bg-primary-600 px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
      >
        Save
      </button>
    </div>
  );
};

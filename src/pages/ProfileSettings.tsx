import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Event as NostrEvent, EventTemplate } from 'nostr-tools';
import { finalizeEvent } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';
import { useNostr } from '../nostr';
import { verifyNip05 } from '../nostr/events';
import { getPrivKey } from '../nostr/auth';
import { Button, Input } from '../components/ui';
import { isValidUrl, isValidNip05 } from '../validators';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';

interface ProfileMeta {
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  lud16?: string;
}

async function signEvent(tpl: EventTemplate): Promise<NostrEvent> {
  const priv = getPrivKey();
  const nostr = (window as any).nostr;
  const event = { ...tpl, created_at: Math.floor(Date.now() / 1000) } as NostrEvent;
  if (priv) {
    return finalizeEvent(event, hexToBytes(priv));
  }
  if (nostr && typeof nostr.signEvent === 'function') {
    return nostr.signEvent(event);
  }
  throw new Error('not logged in');
}

export const ProfileSettingsPage: React.FC = () => {
  const { metadata, pubkey } = useNostr();
  const navigate = useNavigate();
  const [form, setForm] = React.useState<ProfileMeta>(() => ({
    name: (metadata as ProfileMeta | null)?.name ?? '',
    about: (metadata as ProfileMeta | null)?.about ?? '',
    picture: (metadata as ProfileMeta | null)?.picture ?? '',
    nip05: (metadata as ProfileMeta | null)?.nip05 ?? '',
    lud16: (metadata as ProfileMeta | null)?.lud16 ?? '',
  }));
  const [errors, setErrors] = React.useState<{ picture?: string; nip05?: string }>({});
  const [touched, setTouched] = React.useState<{ picture?: boolean; nip05?: boolean }>({});
  const [verified, setVerified] = React.useState<boolean | null>(null);

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
    return null;
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
    if (!pubkey) return;
    const evt = await signEvent({
      kind: 0,
      content: JSON.stringify(form),
      tags: [],
      pubkey,
    });
    await fetch(`${API_BASE}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evt),
    });
    if (form.nip05) {
      setVerified(await verifyNip05(form.nip05, pubkey));
    }
    navigate('/profile');
  };

  const isFormValid = !errors.picture && !errors.nip05;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <Input name="name" value={form.name} onChange={handleChange} />
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
          <Input
            name="picture"
            value={form.picture}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.picture && errors.picture && (
            <p className="text-red-600 text-sm">{errors.picture}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium">NIP-05</label>
          <Input
            name="nip05"
            value={form.nip05}
            onChange={handleChange}
            onBlur={handleBlur}
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
          <Input name="lud16" value={form.lud16} onChange={handleChange} />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-sm font-medium">Preview</h2>
        <div className="flex items-center gap-4 border p-2 rounded">
          {form.picture && (
            <img
              src={form.picture}
              alt="avatar preview"
              className="h-16 w-16 rounded-full object-cover"
            />
          )}
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold">{form.name || pubkey}</h3>
            {form.about && <p className="text-sm text-text-muted">{form.about}</p>}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!isFormValid}
          variant="primary"
          className="px-4 py-2"
        >
          Save
        </Button>
        <Button onClick={() => navigate(-1)} className="px-4 py-2">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;

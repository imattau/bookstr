import React, { useState } from 'react';
import { useNostr } from '../nostr';

/**
 * Manage the list of followed pubkeys. Allows adding new contacts
 * and removing existing ones. Updated lists are published via
 * `saveContacts` from the nostr context.
 */
export const ContactsManager: React.FC = () => {
  const { contacts, saveContacts } = useNostr();
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const pk = input.trim();
    if (!pk) return;
    if (contacts.includes(pk)) {
      setInput('');
      return;
    }
    saveContacts([...contacts, pk]);
    setInput('');
  };

  const handleRemove = (pk: string) => {
    saveContacts(contacts.filter((p) => p !== pk));
  };

  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {contacts.map((pk) => (
          <li key={pk} className="flex items-center gap-2">
            <span className="flex-1 break-all text-sm">{pk}</span>
            <button
              onClick={() => handleRemove(pk)}
              className="text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600/50"
            >
              Unfollow
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded border p-2"
          placeholder="Pubkey"
        />
        <button
          onClick={handleAdd}
          className="rounded bg-primary-600 px-3 py-1 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
        >
          Follow
        </button>
      </div>
    </div>
  );
};

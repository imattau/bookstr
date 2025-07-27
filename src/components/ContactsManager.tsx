import React, { useState } from 'react';
import { useNostr } from '../nostr';
import { AuthorCard } from './AuthorCard';

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

  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {contacts.map((pk) => (
          <li key={pk}>
            <AuthorCard pubkey={pk} />
          </li>
        ))}
      </ul>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded border p-[var(--space-2)]"
            placeholder="Pubkey"
          />
          <button
            onClick={handleAdd}
            className="rounded bg-[color:var(--clr-primary-600)] px-[var(--space-3)] py-[var(--space-1)] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
          >
          Follow
        </button>
      </div>
    </div>
  );
};

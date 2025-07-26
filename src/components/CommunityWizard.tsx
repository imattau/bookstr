import React, { useState } from 'react';
import { useNostr } from '../nostr';

export const CommunityWizard: React.FC = () => {
  const { publish } = useNostr();
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');

  const handlePublish = async () => {
    if (!name.trim()) return;
    await publish({ kind: 172, content: about, tags: [['name', name]] });
    setName('');
    setAbout('');
  };

  return (
    <div className="space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Community name"
        className="w-full rounded border p-2"
      />
      <textarea
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        placeholder="Description"
        className="w-full rounded border p-2"
      />
      <button
        onClick={handlePublish}
        className="rounded bg-primary-600 px-4 py-2 text-white"
      >
        Create
      </button>
    </div>
  );
};

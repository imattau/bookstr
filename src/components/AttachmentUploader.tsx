import React, { useState } from 'react';
import { useNostr } from '../nostr';

async function uploadAttachment(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) throw new Error('upload failed');
  const data = await res.json();
  return data.url as string;
}

interface AttachmentUploaderProps {
  bookId?: string;
  onUploaded?: (url: string) => void;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  bookId,
  onUploaded,
}) => {
  const ctx = useNostr();
  const [loading, setLoading] = useState(false);

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadAttachment(file);
      await ctx.publish({
        kind: 1064,
        content: '',
        tags: [
          ['mime', file.type],
          ['url', url],
          ...(bookId ? [['e', bookId]] : []),
        ],
      });
      onUploaded?.(url);
    } catch {
      // ignore errors
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input type="file" onChange={handleFile} disabled={loading} />
      {loading && <p className="text-sm">Uploading...</p>}
    </div>
  );
};

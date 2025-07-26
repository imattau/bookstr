import React from 'react';
import { useNostr } from '../nostr';

export const BookForm: React.FC = () => {
  const { publish } = useNostr();
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [cover, setCover] = React.useState('');

  const handlePublish = async () => {
    await publish({
      kind: 30023,
      content,
      tags: [
        ['title', title],
        ['summary', summary],
        ...tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .map((t) => ['t', t]),
        ...(cover ? [['image', cover]] : []),
      ],
    });
    setTitle('');
    setSummary('');
    setContent('');
    setTags('');
    setCover('');
  };

  return (
    <div className="space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded border p-2"
      />
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Summary"
        className="w-full rounded border p-2"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Content"
        className="w-full rounded border p-2"
      />
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags comma separated"
        className="w-full rounded border p-2"
      />
      <input
        value={cover}
        onChange={(e) => setCover(e.target.value)}
        placeholder="Cover URL"
        className="w-full rounded border p-2"
      />
      <button
        onClick={handlePublish}
        className="rounded bg-primary-600 px-4 py-2 text-white"
      >
        Publish
      </button>
    </div>
  );
};

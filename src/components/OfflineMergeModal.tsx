import React from 'react';
import { createPortal } from 'react-dom';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export interface OfflineMergeModalProps {
  localText: string;
  remoteText: string;
  onResolve: (value: string) => void;
}

/**
 * Modal for resolving offline edit conflicts.
 */
export const OfflineMergeModal: React.FC<OfflineMergeModalProps> = ({
  localText,
  remoteText,
  onResolve,
}) => {
  const [mergeMode, setMergeMode] = React.useState(false);
  const editRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onResolve(remoteText);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onResolve, remoteText]);

  const modal = (
    <Modal onClose={() => onResolve(remoteText)}>
      <div role="dialog" aria-modal="true" aria-labelledby="offline-merge-title">
        <h3
          id="offline-merge-title"
          className="mb-[var(--space-2)] text-[16px] font-bold text-[color:var(--clr-text)]"
        >
          Offline Edit Conflict
        </h3>
        {mergeMode ? (
          <>
            <textarea
              ref={editRef}
              defaultValue={localText}
              aria-label="Merged content"
              className="h-[200px] w-full resize-none border p-[var(--space-2)] text-[color:var(--clr-text)]"
            />
            <div className="mt-[var(--space-3)] flex justify-end">
              <Button
                variant="primary"
                onClick={() => onResolve(editRef.current?.value ?? localText)}
              >
                Publish
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-[var(--space-2)]">
              <textarea
                value={remoteText}
                readOnly
                aria-label="Remote content"
                className="h-[200px] w-1/2 resize-none border p-[var(--space-2)] text-[color:var(--clr-text)]"
              />
              <textarea
                value={localText}
                readOnly
                aria-label="Local content"
                className="h-[200px] w-1/2 resize-none border p-[var(--space-2)] text-[color:var(--clr-text)]"
              />
            </div>
            <div className="mt-[var(--space-3)] flex justify-end gap-[var(--space-2)]">
              <Button autoFocus onClick={() => onResolve(remoteText)}>
                Keep Remote
              </Button>
              <Button onClick={() => onResolve(localText)}>Keep Local</Button>
              <Button variant="primary" onClick={() => setMergeMode(true)}>
                Merge
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );

  return createPortal(modal, document.body);
};

export default OfflineMergeModal;

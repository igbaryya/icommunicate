import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MAX_ATTACHMENTS_PER_MESSAGE, type Attachment } from '@icommunicate/shared';
import { formatBytes } from '@/lib/format';
import { createLocalId } from '@/lib/id';
import { TransferError } from '@/lib/transfer';
import { uploadAttachment } from '../attachmentsApi';

export type PendingStatus = 'uploading' | 'done' | 'error';

export interface PendingAttachment {
  localId: string;
  file: File;
  progress: number;
  status: PendingStatus;
  error?: string;
  attachment?: Attachment;
}

/** Files upload as soon as they are added, so sending a message only links already-stored attachments. */
export function usePendingAttachments(maxFileSizeBytes: number | undefined) {
  const [items, setItems] = useState<PendingAttachment[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const aborts = useRef(new Map<string, () => void>());

  useEffect(() => {
    const pending = aborts.current;
    return () => pending.forEach((abort) => abort());
  }, []);

  const update = (localId: string, patch: Partial<PendingAttachment>) =>
    setItems((previous) => previous.map((item) => (item.localId === localId ? { ...item, ...patch } : item)));

  const start = useCallback((localId: string, file: File) => {
    const { promise, abort } = uploadAttachment(file, (progress) => update(localId, { progress }));
    aborts.current.set(localId, abort);
    promise
      .then((attachment) => update(localId, { status: 'done', progress: 1, attachment }))
      .catch((error: TransferError) => {
        if (!error.cancelled) update(localId, { status: 'error', error: error.message });
      })
      .finally(() => aborts.current.delete(localId));
  }, []);

  const add = useCallback(
    (files: File[]) => {
      const room = MAX_ATTACHMENTS_PER_MESSAGE - itemsRef.current.length;
      if (files.length > room) toast.warning(`You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message`);

      const accepted = files.slice(0, Math.max(room, 0)).filter((file) => {
        if (!maxFileSizeBytes || file.size <= maxFileSizeBytes) return true;
        toast.error(`${file.name} is too large`, { description: `The limit is ${formatBytes(maxFileSizeBytes)}` });
        return false;
      });

      const added = accepted.map<PendingAttachment>((file) => ({ localId: createLocalId(), file, progress: 0, status: 'uploading' }));
      setItems((previous) => [...previous, ...added]);
      added.forEach((item) => start(item.localId, item.file));
    },
    [maxFileSizeBytes, start],
  );

  const remove = useCallback((localId: string) => {
    aborts.current.get(localId)?.();
    setItems((previous) => previous.filter((item) => item.localId !== localId));
  }, []);

  const retry = useCallback(
    (localId: string) => {
      const item = itemsRef.current.find((candidate) => candidate.localId === localId);
      if (!item) return;
      update(localId, { status: 'uploading', progress: 0, error: undefined });
      start(localId, item.file);
    },
    [start],
  );

  const clear = useCallback(() => setItems([]), []);

  const readyIds = useMemo(() => items.flatMap((item) => (item.attachment ? [item.attachment.id] : [])), [items]);
  const isUploading = items.some((item) => item.status === 'uploading');

  return { items, add, remove, retry, clear, readyIds, isUploading };
}

export type PendingAttachments = ReturnType<typeof usePendingAttachments>;

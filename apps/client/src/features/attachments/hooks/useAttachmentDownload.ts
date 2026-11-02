import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Attachment } from '@icommunicate/shared';
import { TransferError } from '@/lib/transfer';
import { downloadAttachment, saveBlob } from '../attachmentsApi';

export function useAttachmentDownload(attachment: Attachment) {
  const [progress, setProgress] = useState<number | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => () => abortRef.current?.(), []);

  const download = async () => {
    if (abortRef.current) return;
    setProgress(0);
    const { promise, abort } = downloadAttachment(attachment, setProgress);
    abortRef.current = abort;
    try {
      saveBlob(await promise, attachment.name);
    } catch (error) {
      if (!(error instanceof TransferError && error.cancelled)) {
        toast.error(`Could not download ${attachment.name}`, { description: (error as Error).message });
      }
    } finally {
      abortRef.current = null;
      setProgress(null);
    }
  };

  return { download, cancel: () => abortRef.current?.(), progress, isDownloading: progress !== null };
}

import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Check, RotateCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Tooltip } from '@/components/ui/tooltip';
import { formatBytes } from '@/lib/format';
import type { PendingAttachments } from '../hooks/usePendingAttachments';
import { FileIcon } from './FileIcon';

export function PendingAttachmentList({ uploads }: { uploads: PendingAttachments }) {
  return (
    <AnimatePresence initial={false}>
      {uploads.items.length > 0 && (
        <motion.ul
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="flex gap-2 overflow-x-auto px-3 pt-3"
        >
          <AnimatePresence initial={false}>
            {uploads.items.map((item) => (
              <motion.li
                key={item.localId}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex w-60 shrink-0 items-center gap-2.5 rounded-xl border border-border bg-surface-3 p-2"
              >
                <FileIcon mimeType={item.file.type || 'application/octet-stream'} className="size-9" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-xs font-medium" title={item.file.name}>
                    {item.file.name}
                  </p>
                  {item.status === 'uploading' && <ProgressBar value={item.progress} />}
                  {item.status === 'done' && (
                    <p className="flex items-center gap-1 text-[11px] text-muted">
                      <Check className="size-3 text-success" /> {formatBytes(item.file.size)}
                    </p>
                  )}
                  {item.status === 'error' && (
                    <p className="flex items-center gap-1 truncate text-[11px] text-danger" title={item.error}>
                      <AlertCircle className="size-3 shrink-0" /> {item.error}
                    </p>
                  )}
                </div>
                {item.status === 'error' && (
                  <Tooltip content="Retry upload">
                    <Button variant="ghost" size="icon-sm" aria-label="Retry upload" onClick={() => uploads.retry(item.localId)}>
                      <RotateCw className="size-3.5" />
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content={item.status === 'uploading' ? 'Cancel upload' : 'Remove'}>
                  <Button variant="danger" size="icon-sm" aria-label="Remove attachment" onClick={() => uploads.remove(item.localId)}>
                    <X className="size-3.5" />
                  </Button>
                </Tooltip>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </AnimatePresence>
  );
}

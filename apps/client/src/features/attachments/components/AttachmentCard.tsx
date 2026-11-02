import { useState } from 'react';
import { Download, Eye, X } from 'lucide-react';
import { getFileKind, isPreviewable, type Attachment } from '@icommunicate/shared';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Tooltip } from '@/components/ui/tooltip';
import { formatBytes, getExtension } from '@/lib/format';
import { attachmentUrl } from '../attachmentsApi';
import { useAttachmentDownload } from '../hooks/useAttachmentDownload';
import { AttachmentPreviewDialog } from './AttachmentPreviewDialog';
import { FileIcon } from './FileIcon';

export function AttachmentCard({ attachment }: { attachment: Attachment }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const { download, cancel, progress, isDownloading } = useAttachmentDownload(attachment);
  const showThumbnail = getFileKind(attachment.mimeType) === 'image' && !imageFailed;
  const openPreview = () => setPreviewOpen(true);

  return (
    <div className="w-72 max-w-full overflow-hidden rounded-xl border border-white/10 bg-black/25">
      {showThumbnail && (
        <button type="button" onClick={openPreview} className="block w-full cursor-zoom-in bg-black/30">
          <img
            src={attachmentUrl(attachment.id)}
            alt={attachment.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="max-h-64 w-full object-cover transition-opacity hover:opacity-90"
          />
        </button>
      )}

      <div className="flex items-center gap-3 p-2.5">
        {!showThumbnail && <FileIcon mimeType={attachment.mimeType} />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={attachment.name}>
            {attachment.name}
          </p>
          <p className="text-xs opacity-60">
            {formatBytes(attachment.size)} · {getExtension(attachment.name)}
          </p>
        </div>
        {isPreviewable(attachment.mimeType) && !showThumbnail && (
          <Tooltip content="Preview">
            <Button variant="ghost" size="icon-sm" aria-label="Preview" onClick={openPreview}>
              <Eye className="size-4" />
            </Button>
          </Tooltip>
        )}
        <Tooltip content={isDownloading ? 'Cancel download' : 'Download'}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={isDownloading ? 'Cancel download' : 'Download'}
            onClick={isDownloading ? cancel : download}
          >
            {isDownloading ? <X className="size-4" /> : <Download className="size-4" />}
          </Button>
        </Tooltip>
      </div>

      {isDownloading && (
        <div className="flex items-center gap-2 px-2.5 pb-2.5 text-[11px] opacity-70">
          <ProgressBar value={progress ?? 0} />
          <span className="w-9 text-right tabular-nums">{Math.round((progress ?? 0) * 100)}%</span>
        </div>
      )}

      <AttachmentPreviewDialog attachment={attachment} open={previewOpen} onOpenChange={setPreviewOpen} onDownload={download} />
    </div>
  );
}

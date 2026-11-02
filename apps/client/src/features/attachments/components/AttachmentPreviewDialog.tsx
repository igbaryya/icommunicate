import { Download } from 'lucide-react';
import { getFileKind, type Attachment } from '@icommunicate/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatBytes } from '@/lib/format';
import { attachmentUrl } from '../attachmentsApi';

interface AttachmentPreviewDialogProps {
  attachment: Attachment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
}

function PreviewBody({ attachment }: { attachment: Attachment }) {
  const src = attachmentUrl(attachment.id);
  switch (getFileKind(attachment.mimeType)) {
    case 'image':
      return <img src={src} alt={attachment.name} className="mx-auto max-h-[75dvh] object-contain" />;
    case 'video':
      return <video src={src} controls autoPlay className="mx-auto max-h-[75dvh] w-full bg-black" />;
    case 'audio':
      return <audio src={src} controls autoPlay className="m-6 w-[calc(100%-3rem)]" />;
    case 'pdf':
    case 'text':
      return <iframe src={src} title={attachment.name} className="h-[75dvh] w-full bg-white" />;
    default:
      return null;
  }
}

export function AttachmentPreviewDialog({ attachment, open, onOpenChange, onDownload }: AttachmentPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={attachment.name}
        description={`${formatBytes(attachment.size)} · ${attachment.mimeType}`}
        className="w-[min(64rem,calc(100vw-2rem))]"
        actions={
          <Button variant="ghost" size="icon-sm" aria-label="Download" onClick={onDownload}>
            <Download className="size-4" />
          </Button>
        }
      >
        <div className="bg-bg">{open && <PreviewBody attachment={attachment} />}</div>
      </DialogContent>
    </Dialog>
  );
}

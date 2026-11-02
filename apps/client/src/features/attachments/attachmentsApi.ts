import { API_PREFIX, UPLOAD_FIELD_NAME, type Attachment } from '@icommunicate/shared';
import { transfer } from '@/lib/transfer';

export const attachmentUrl = (id: string, { download = false } = {}) =>
  `${API_PREFIX}/attachments/${id}/file${download ? '?download=1' : ''}`;

export function uploadAttachment(file: File, onProgress: (fraction: number) => void) {
  const body = new FormData();
  body.append(UPLOAD_FIELD_NAME, file, file.name);
  return transfer<Attachment>({ method: 'POST', url: `${API_PREFIX}/attachments`, body, onProgress });
}

export function downloadAttachment(attachment: Attachment, onProgress: (fraction: number) => void) {
  return transfer<Blob>({
    method: 'GET',
    url: attachmentUrl(attachment.id, { download: true }),
    responseType: 'blob',
    totalBytes: attachment.size,
    onProgress,
  });
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = Object.assign(document.createElement('a'), { href: url, download: filename });
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

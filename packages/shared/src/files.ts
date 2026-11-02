export type FileKind = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'archive' | 'other';

const ARCHIVE_MIME_TYPES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/gzip',
  'application/x-tar',
]);

const PREVIEWABLE_KINDS: ReadonlySet<FileKind> = new Set(['image', 'pdf', 'video', 'audio', 'text']);

export function getFileKind(mimeType: string): FileKind {
  const mime = mimeType.toLowerCase();
  // SVG can carry scripts, so it is never rendered inline.
  if (mime === 'image/svg+xml') return 'other';
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'text/plain') return 'text';
  if (ARCHIVE_MIME_TYPES.has(mime)) return 'archive';
  return 'other';
}

export const isPreviewable = (mimeType: string) => PREVIEWABLE_KINDS.has(getFileKind(mimeType));

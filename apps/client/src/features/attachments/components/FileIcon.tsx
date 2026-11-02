import { File, FileArchive, FileAudio, FileImage, FileText, FileVideo, type LucideIcon } from 'lucide-react';
import { getFileKind, type FileKind } from '@icommunicate/shared';
import { cn } from '@/lib/cn';

const ICONS: Record<FileKind, { icon: LucideIcon; className: string }> = {
  image: { icon: FileImage, className: 'bg-sky-500/15 text-sky-400' },
  pdf: { icon: FileText, className: 'bg-rose-500/15 text-rose-400' },
  video: { icon: FileVideo, className: 'bg-violet-500/15 text-violet-400' },
  audio: { icon: FileAudio, className: 'bg-emerald-500/15 text-emerald-400' },
  text: { icon: FileText, className: 'bg-slate-500/20 text-slate-300' },
  archive: { icon: FileArchive, className: 'bg-amber-500/15 text-amber-400' },
  other: { icon: File, className: 'bg-slate-500/20 text-slate-300' },
};

export function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  const { icon: Icon, className: tone } = ICONS[getFileKind(mimeType)];
  return (
    <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', tone, className)}>
      <Icon className="size-5" />
    </span>
  );
}

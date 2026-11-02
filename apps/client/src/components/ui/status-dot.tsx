import { cn } from '@/lib/cn';

export type Status = 'online' | 'offline' | 'pending';

const STATUS_CLASSES: Record<Status, string> = {
  online: 'bg-success shadow-[0_0_8px_var(--color-success)]',
  offline: 'bg-muted/40',
  pending: 'bg-warning animate-pulse',
};

export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return <span className={cn('inline-block size-2 shrink-0 rounded-full', STATUS_CLASSES[status], className)} />;
}

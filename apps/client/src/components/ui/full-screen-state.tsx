import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FullScreenStateProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function FullScreenState({ icon, title, description, action, className }: FullScreenStateProps) {
  return (
    <div className={cn('flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center', className)}>
      <div className="grid size-14 place-items-center rounded-2xl border border-border bg-surface-2 text-muted">{icon}</div>
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

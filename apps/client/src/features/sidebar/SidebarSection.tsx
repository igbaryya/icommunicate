import type { ReactNode } from 'react';

interface SidebarSectionProps {
  title: string;
  meta?: ReactNode;
  empty?: string;
  children?: ReactNode;
}

export function SidebarSection({ title, meta, empty, children }: SidebarSectionProps) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="space-y-1">
      <h2 className="flex items-center justify-between px-2 text-[11px] font-semibold tracking-wider text-muted/80 uppercase">
        {title}
        {meta}
      </h2>
      {hasItems ? <ul className="space-y-0.5">{children}</ul> : empty && <p className="px-2 py-1 text-xs text-muted/60">{empty}</p>}
    </section>
  );
}

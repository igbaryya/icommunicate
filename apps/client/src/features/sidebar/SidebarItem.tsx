import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  hint?: ReactNode;
  unread?: number;
  active?: boolean;
  muted?: boolean;
  onClick: () => void;
}

export function SidebarItem({ icon, label, hint, unread = 0, active, muted, onClick }: SidebarItemProps) {
  return (
    <motion.li layout="position" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'group relative flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
          active ? 'bg-accent/15 text-fg' : 'text-muted hover:bg-white/5 hover:text-fg',
          muted && !active && 'opacity-60',
          unread > 0 && 'font-semibold text-fg',
        )}
      >
        {active && (
          <motion.span layoutId="sidebar-active" className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent" />
        )}
        {icon}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {hint}
        {unread > 0 && (
          <span className="min-w-5 rounded-full bg-accent px-1.5 text-center text-[11px] leading-5 font-semibold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
    </motion.li>
  );
}

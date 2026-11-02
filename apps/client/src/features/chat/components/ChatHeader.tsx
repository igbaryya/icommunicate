import { Hash, Menu } from 'lucide-react';
import type { Conversation } from '@icommunicate/shared';
import { useAppDispatch } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { StatusDot } from '@/components/ui/status-dot';
import { DeviceAvatar } from '@/features/devices/components/DeviceAvatar';
import { useConversationMeta } from '@/features/devices/hooks';
import { formatRelative } from '@/lib/format';
import { useGetDevicesQuery } from '@/services/api';
import { sidebarToggled } from '../chatSlice';

export function ChatHeader({ conversation }: { conversation: Conversation }) {
  const dispatch = useAppDispatch();
  const { title, peer } = useConversationMeta(conversation);
  const { data: devices = [] } = useGetDevicesQuery();
  const onlineCount = devices.filter((device) => device.online).length;

  const subtitle = peer
    ? `${peer.ip} · ${peer.online ? 'Online' : `Last seen ${formatRelative(peer.lastSeenAt)}`}`
    : `${onlineCount} of ${devices.length} machines online`;

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/60 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open sidebar" onClick={() => dispatch(sidebarToggled(true))}>
        <Menu className="size-5" />
      </Button>
      {peer ? (
        <DeviceAvatar device={peer} size="lg" showPresence />
      ) : (
        <span className="grid size-10 place-items-center rounded-xl bg-surface-3 text-muted">
          <Hash className="size-5" />
        </span>
      )}
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        <p className="flex items-center gap-1.5 truncate font-mono text-[11px] text-muted">
          {peer && <StatusDot status={peer.online ? 'online' : 'offline'} className="size-1.5" />}
          {subtitle}
        </p>
      </div>
    </header>
  );
}

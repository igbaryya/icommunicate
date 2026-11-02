import { useState } from 'react';
import { Hash, Server } from 'lucide-react';
import { toast } from 'sonner';
import type { Device } from '@icommunicate/shared';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { StatusDot } from '@/components/ui/status-dot';
import { conversationOpened, selectActiveConversationId, selectSidebarOpen, selectUnread, sidebarToggled } from '@/features/chat/chatSlice';
import { DeviceAvatar } from '@/features/devices/components/DeviceAvatar';
import { getConversationMeta, useDevicesById, useMe, usePeers } from '@/features/devices/hooks';
import { getConnectionHosts } from '@/features/server/connectionUrls';
import { ServerInfoDialog } from '@/features/server/ServerInfoDialog';
import { selectIsConnected } from '@/features/session/sessionSlice';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/lib/errors';
import { useGetConversationsQuery, useGetServerInfoQuery, useOpenDmMutation } from '@/services/api';
import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';

const byRecentActivity = (a: { lastMessageAt: number | null; createdAt: number }, b: typeof a) =>
  (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt);

export function Sidebar() {
  const dispatch = useAppDispatch();
  const me = useMe();
  const peers = usePeers();
  const devicesById = useDevicesById();
  const activeId = useAppSelector(selectActiveConversationId);
  const unread = useAppSelector(selectUnread);
  const open = useAppSelector(selectSidebarOpen);
  const connected = useAppSelector(selectIsConnected);
  const { data: conversations = [] } = useGetConversationsQuery();
  const { data: info } = useGetServerInfoQuery();
  const [openDm] = useOpenDmMutation();
  const [serverInfoOpen, setServerInfoOpen] = useState(false);

  const channels = conversations.filter((conversation) => conversation.type === 'channel');
  const directMessages = conversations.filter((conversation) => conversation.type === 'dm').sort(byRecentActivity);
  const onlineCount = peers.filter((peer) => peer.online).length;

  const openConversation = (id: string) => dispatch(conversationOpened(id));

  const messageDevice = async (device: Device) => {
    try {
      const conversation = await openDm({ deviceId: device.id }).unwrap();
      openConversation(conversation.id);
    } catch (error) {
      toast.error(getErrorMessage(error, `Could not open a chat with ${device.hostname}`));
    }
  };

  return (
    <>
      <div
        onClick={() => dispatch(sidebarToggled(false))}
        className={cn('fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-surface transition-transform duration-300 md:static md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <header className="flex items-center gap-2.5 px-4 pt-4 pb-3">
          <img src="/logo.svg" alt="" className="size-8" />
          <div>
            <h1 className="text-sm leading-tight font-semibold">iCommunicate</h1>
            <p className="text-[11px] text-muted">Private LAN messenger</p>
          </div>
        </header>

        <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-2">
          <SidebarSection title="Channels">
            {channels.map((channel) => (
              <SidebarItem
                key={channel.id}
                icon={<Hash className="size-4 shrink-0" />}
                label={channel.name ?? channel.id}
                active={channel.id === activeId}
                unread={unread[channel.id]}
                onClick={() => openConversation(channel.id)}
              />
            ))}
          </SidebarSection>

          <SidebarSection title="Direct messages" empty="Pick a machine below to start chatting">
            {directMessages.map((conversation) => {
              const { title, peer } = getConversationMeta(conversation, me?.id, devicesById);
              return (
                <SidebarItem
                  key={conversation.id}
                  icon={<DeviceAvatar device={peer} size="sm" showPresence />}
                  label={title}
                  active={conversation.id === activeId}
                  unread={unread[conversation.id]}
                  muted={!peer?.online}
                  onClick={() => openConversation(conversation.id)}
                />
              );
            })}
          </SidebarSection>

          <SidebarSection
            title="Machines"
            meta={<span className="font-normal tracking-normal normal-case">{onlineCount} online</span>}
            empty="No other machines have connected yet"
          >
            {peers.map((device) => (
              <SidebarItem
                key={device.id}
                icon={<DeviceAvatar device={device} size="sm" showPresence />}
                label={device.hostname}
                hint={<span className="font-mono text-[10px] text-muted/70">{device.ip}</span>}
                muted={!device.online}
                onClick={() => messageDevice(device)}
              />
            ))}
          </SidebarSection>
        </nav>

        <footer className="space-y-2 border-t border-border p-3">
          {me && (
            <div className="flex items-center gap-2.5 px-1">
              <DeviceAvatar device={me} size="lg" showPresence />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{me.hostname}</p>
                <p className="truncate font-mono text-[11px] text-muted">{me.ip} · you</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setServerInfoOpen(true)}
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-xs transition-colors hover:bg-surface-3"
          >
            <Server className="size-3.5 text-muted" />
            <span className="flex-1 truncate font-mono">
              {(info && getConnectionHosts(info)[0]) ?? 'LAN server'}
            </span>
            <StatusDot status={connected ? 'online' : 'pending'} />
          </button>
        </footer>
      </aside>

      <ServerInfoDialog open={serverInfoOpen} onOpenChange={setServerInfoOpen} />
    </>
  );
}

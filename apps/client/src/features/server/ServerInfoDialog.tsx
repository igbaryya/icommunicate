import type { ReactNode } from 'react';
import { HardDrive, Network, Server, Users } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { CopyButton } from '@/components/ui/copy-button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { StatusDot } from '@/components/ui/status-dot';
import { DeviceAvatar } from '@/features/devices/components/DeviceAvatar';
import { selectIsConnected } from '@/features/session/sessionSlice';
import { formatBytes, formatRelative } from '@/lib/format';
import { useGetDevicesQuery, useGetServerInfoQuery } from '@/services/api';
import { getConnectionUrls } from './connectionUrls';

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-muted uppercase">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

interface ServerInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServerInfoDialog({ open, onOpenChange }: ServerInfoDialogProps) {
  const { data: info } = useGetServerInfoQuery();
  const { data: devices = [] } = useGetDevicesQuery();
  const connected = useAppSelector(selectIsConnected);
  const online = devices.filter((device) => device.online);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="LAN server" description="Share one of these addresses with machines on your network">
        {info && (
          <div className="space-y-6 p-5">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
              <div className="grid size-10 place-items-center rounded-lg bg-accent/15 text-accent">
                <Server className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{info.hostname}</p>
                <p className="text-xs text-muted">Started {formatRelative(info.startedAt)}</p>
              </div>
              <span className="flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs">
                <StatusDot status={connected ? 'online' : 'pending'} />
                {connected ? 'Running' : 'Reconnecting'}
              </span>
            </div>

            <Section icon={<Network className="size-3.5" />} title="Connect from another machine">
              <ul className="space-y-1.5">
                {getConnectionUrls(info).map((url) => (
                  <li
                    key={url}
                    className="flex items-center justify-between rounded-lg border border-border bg-bg/60 py-1 pr-1 pl-3 font-mono text-sm"
                  >
                    {url}
                    <CopyButton value={url} label={`Copy ${url}`} />
                  </li>
                ))}
              </ul>
            </Section>

            <Section icon={<Users className="size-3.5" />} title={`Connected clients (${online.length})`}>
              <ul className="space-y-1">
                {online.map((device) => (
                  <li key={device.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5">
                    <DeviceAvatar device={device} size="sm" showPresence />
                    <span className="flex-1 truncate text-sm">{device.hostname}</span>
                    <span className="font-mono text-xs text-muted">{device.ip}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section icon={<HardDrive className="size-3.5" />} title="Limits">
              <p className="text-sm text-muted">
                Attachments up to <span className="text-fg">{formatBytes(info.maxFileSizeBytes)}</span> each, stored on
                the host machine.
              </p>
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

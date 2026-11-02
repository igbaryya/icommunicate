import type { Device } from '@icommunicate/shared';
import { cn } from '@/lib/cn';
import { StatusDot } from '@/components/ui/status-dot';

const GRADIENTS = [
  'from-violet-500 to-fuchsia-500',
  'from-sky-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-500',
];

const SIZES = {
  sm: 'size-6 text-[10px] rounded-md',
  md: 'size-8 text-xs rounded-lg',
  lg: 'size-10 text-sm rounded-xl',
};

const hash = (value: string) => [...value].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);

const getInitials = (hostname: string) =>
  hostname
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('') || '?';

interface DeviceAvatarProps {
  device?: Pick<Device, 'id' | 'hostname' | 'online'>;
  size?: keyof typeof SIZES;
  showPresence?: boolean;
  className?: string;
}

export function DeviceAvatar({ device, size = 'md', showPresence = false, className }: DeviceAvatarProps) {
  const gradient = GRADIENTS[Math.abs(hash(device?.id ?? '')) % GRADIENTS.length];

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'grid place-items-center bg-gradient-to-br font-semibold text-white shadow-inner shadow-white/20',
          gradient,
          SIZES[size],
        )}
      >
        {getInitials(device?.hostname ?? '?')}
      </span>
      {showPresence && device && (
        <StatusDot
          status={device.online ? 'online' : 'offline'}
          className="absolute -right-0.5 -bottom-0.5 size-2.5 ring-2 ring-surface"
        />
      )}
    </span>
  );
}

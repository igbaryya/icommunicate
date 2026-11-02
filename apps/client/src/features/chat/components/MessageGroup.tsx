import { motion } from 'motion/react';
import type { Device, Message } from '@icommunicate/shared';
import { AttachmentCard } from '@/features/attachments/components/AttachmentCard';
import { DeviceAvatar } from '@/features/devices/components/DeviceAvatar';
import { cn } from '@/lib/cn';
import { formatFullDate, formatTime } from '@/lib/format';
import { MessageText } from './MessageText';

interface MessageGroupProps {
  sender?: Device;
  messages: Message[];
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className={cn(
        'max-w-full space-y-2 rounded-2xl px-3.5 py-2 shadow-sm',
        isOwn
          ? 'rounded-tr-md bg-gradient-to-br from-accent to-violet-600 text-white shadow-accent/20'
          : 'rounded-tl-md border border-border bg-surface-2',
      )}
    >
      {message.body && <MessageText text={message.body} />}
      {message.attachments.length > 0 && (
        <div className="flex flex-col gap-2">
          {message.attachments.map((attachment) => (
            <AttachmentCard key={attachment.id} attachment={attachment} />
          ))}
        </div>
      )}
      <time
        dateTime={new Date(message.createdAt).toISOString()}
        title={formatFullDate(message.createdAt)}
        className={cn('block text-right text-[10px] tabular-nums', isOwn ? 'text-white/70' : 'text-muted')}
      >
        {formatTime(message.createdAt)}
      </time>
    </motion.div>
  );
}

export function MessageGroup({ sender, messages, isOwn }: MessageGroupProps) {
  return (
    <div className={cn('flex gap-3 px-4 py-1.5 md:px-6', isOwn && 'flex-row-reverse')}>
      {!isOwn && <DeviceAvatar device={sender} size="md" showPresence className="mt-5" />}
      <div className={cn('flex max-w-[min(40rem,85%)] min-w-0 flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        <div className="flex items-baseline gap-2 px-1 text-xs">
          <span className="font-semibold">{isOwn ? 'You' : (sender?.hostname ?? 'Unknown machine')}</span>
          {!isOwn && sender && <span className="font-mono text-[10px] text-muted">{sender.ip}</span>}
        </div>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} isOwn={isOwn} />
        ))}
      </div>
    </div>
  );
}

import { AnimatePresence, motion } from 'motion/react';
import { UploadCloud } from 'lucide-react';
import type { Conversation } from '@icommunicate/shared';
import { useFileDrop } from '@/features/attachments/hooks/useFileDrop';
import { usePendingAttachments } from '@/features/attachments/hooks/usePendingAttachments';
import { useConversationMeta } from '@/features/devices/hooks';
import { formatBytes } from '@/lib/format';
import { useGetServerInfoQuery } from '@/services/api';
import { ChatHeader } from './ChatHeader';
import { Composer } from './Composer';
import { MessageList } from './MessageList';

export function ChatView({ conversation }: { conversation: Conversation }) {
  const { data: info } = useGetServerInfoQuery();
  const { title } = useConversationMeta(conversation);
  const uploads = usePendingAttachments(info?.maxFileSizeBytes);
  const { isDragging, dropZoneProps } = useFileDrop(uploads.add);
  const target = conversation.type === 'channel' ? `#${title}` : title;

  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col" {...dropZoneProps}>
      <ChatHeader conversation={conversation} />
      <MessageList conversationId={conversation.id} />
      <Composer conversationId={conversation.id} placeholder={`Message ${target}`} uploads={uploads} />

      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-3 z-20 grid place-items-center rounded-2xl border-2 border-dashed border-accent/60 bg-bg/80 backdrop-blur-sm"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2 text-center">
              <UploadCloud className="size-10 text-accent" />
              <p className="text-sm font-semibold">Drop files to send to {target}</p>
              {info && <p className="text-xs text-muted">Up to {formatBytes(info.maxFileSizeBytes)} per file</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

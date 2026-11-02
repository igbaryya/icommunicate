import { useEffect, useMemo, useRef } from 'react';
import { Loader2, MessagesSquare } from 'lucide-react';
import { FullScreenState } from '@/components/ui/full-screen-state';
import { useDevicesById, useMe } from '@/features/devices/hooks';
import { formatDay } from '@/lib/format';
import { useGetMessagesInfiniteQuery } from '@/services/api';
import { buildMessageItems } from '../lib/buildMessageItems';
import { MessageGroup } from './MessageGroup';

const Spinner = () => <Loader2 className="size-5 animate-spin text-muted" />;

function DayDivider({ timestamp }: { timestamp: number }) {
  return (
    <div className="sticky top-2 z-10 my-3 flex justify-center">
      <span className="rounded-full border border-border bg-surface/90 px-3 py-0.5 text-[11px] font-medium text-muted backdrop-blur">
        {formatDay(timestamp)}
      </span>
    </div>
  );
}

export function MessageList({ conversationId }: { conversationId: string }) {
  const me = useMe();
  const devicesById = useDevicesById();
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useGetMessagesInfiniteQuery(conversationId);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => buildMessageItems([...(data?.pages ?? [])].reverse().flat()), [data]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !isFetchingNextPage) fetchNextPage();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <FullScreenState icon={<Spinner />} title="Loading messages" />;

  return (
    // column-reverse keeps the view pinned to the newest message and preserves position when older pages load.
    <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto">
      <div className="py-4">
        <div ref={sentinelRef} className="flex h-8 justify-center">
          {isFetchingNextPage && <Spinner />}
        </div>
        {!items.length && (
          <FullScreenState
            icon={<MessagesSquare className="size-6" />}
            title="No messages yet"
            description="Say hello, or drop a file here to share it with the network."
          />
        )}
        {items.map((item) =>
          item.type === 'day' ? (
            <DayDivider key={item.key} timestamp={item.timestamp} />
          ) : (
            <MessageGroup
              key={item.key}
              sender={devicesById.get(item.senderId)}
              messages={item.messages}
              isOwn={item.senderId === me?.id}
            />
          ),
        )}
      </div>
    </div>
  );
}

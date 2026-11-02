import { useEffect } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Toaster } from 'sonner';
import { GENERAL_CONVERSATION_ID } from '@icommunicate/shared';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { FullScreenState } from '@/components/ui/full-screen-state';
import { TooltipProvider } from '@/components/ui/tooltip';
import { selectActiveConversationId, selectTotalUnread } from '@/features/chat/chatSlice';
import { ChatView } from '@/features/chat/components/ChatView';
import { ConnectionBanner } from '@/features/server/ConnectionBanner';
import { Sidebar } from '@/features/sidebar/Sidebar';
import { getErrorMessage } from '@/lib/errors';
import { useGetConversationsQuery, useGetSessionQuery } from '@/services/api';

const APP_TITLE = 'iCommunicate';

function useUnreadTitle() {
  const totalUnread = useAppSelector(selectTotalUnread);
  useEffect(() => {
    document.title = totalUnread ? `(${totalUnread}) ${APP_TITLE}` : APP_TITLE;
  }, [totalUnread]);
}

function Workspace() {
  const activeId = useAppSelector(selectActiveConversationId);
  const { data: conversations } = useGetConversationsQuery();
  const active =
    conversations?.find((conversation) => conversation.id === activeId) ??
    conversations?.find((conversation) => conversation.id === GENERAL_CONVERSATION_ID);

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(ellipse_at_top,var(--color-surface-2),var(--color-bg)_60%)]">
        <ConnectionBanner />
        {active ? (
          <ChatView key={active.id} conversation={active} />
        ) : (
          <FullScreenState icon={<Loader2 className="size-5 animate-spin" />} title="Loading conversations" />
        )}
      </main>
    </div>
  );
}

export function App() {
  const { isLoading, error, refetch } = useGetSessionQuery();
  useUnreadTitle();

  return (
    <TooltipProvider>
      {isLoading ? (
        <div className="flex h-dvh">
          <FullScreenState icon={<Loader2 className="size-5 animate-spin" />} title="Identifying this machine…" />
        </div>
      ) : error ? (
        <div className="flex h-dvh">
          <FullScreenState
            icon={<ShieldAlert className="size-6 text-danger" />}
            title="Cannot reach the LAN server"
            description={getErrorMessage(error, 'Make sure the host machine is running iCommunicate and is on the same network.')}
            action={<Button onClick={refetch}>Try again</Button>}
          />
        </div>
      ) : (
        <Workspace />
      )}
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
    </TooltipProvider>
  );
}

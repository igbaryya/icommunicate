import { SocketEvent } from '@icommunicate/shared';
import type { AppStore } from '@/app/store';
import { incomingMessage } from '@/features/chat/chatSlice';
import { connectionChanged, selectMe } from '@/features/session/sessionSlice';
import { upsertById } from '@/lib/collections';
import { api } from './api';
import { socket } from './socket';

/** Binds socket events to the store once; RTK Query caches are the single source of truth. */
export function startRealtime({ dispatch, getState }: AppStore) {
  let hasConnected = false;

  socket.on('connect', () => {
    // Anything may have happened while offline, so refetch rather than trying to replay.
    if (hasConnected) dispatch(api.util.invalidateTags(['Device', 'Conversation', 'Message', 'Session']));
    hasConnected = true;
    dispatch(connectionChanged('connected'));
  });
  socket.on('disconnect', () => dispatch(connectionChanged('disconnected')));
  socket.on('connect_error', () => dispatch(connectionChanged('disconnected')));
  socket.io.on('reconnect_attempt', () => dispatch(connectionChanged('connecting')));

  socket.on(SocketEvent.DeviceUpsert, (device) => {
    dispatch(api.util.updateQueryData('getDevices', undefined, (draft) => upsertById(draft, device)));
    if (device.id === selectMe(getState())?.id) {
      dispatch(api.util.updateQueryData('getSession', undefined, (draft) => void (draft.device = device)));
    }
  });

  socket.on(SocketEvent.ConversationUpsert, (conversation) => {
    dispatch(api.util.updateQueryData('getConversations', undefined, (draft) => upsertById(draft, conversation)));
  });

  socket.on(SocketEvent.MessageNew, (message) => {
    dispatch(
      api.util.updateQueryData('getMessages', message.conversationId, (draft) => {
        const newestPage = draft.pages[0];
        if (newestPage && !newestPage.some((existing) => existing.id === message.id)) newestPage.push(message);
      }),
    );
    dispatch(
      api.util.updateQueryData('getConversations', undefined, (draft) => {
        const conversation = draft.find((item) => item.id === message.conversationId);
        if (conversation) conversation.lastMessageAt = message.createdAt;
      }),
    );
    if (message.senderId !== selectMe(getState())?.id) dispatch(incomingMessage(message.conversationId));
  });

  socket.connect();
}

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { GENERAL_CONVERSATION_ID } from '@icommunicate/shared';
import type { RootState } from '@/app/store';

interface ChatState {
  activeConversationId: string;
  unread: Record<string, number>;
  sidebarOpen: boolean;
}

const initialState: ChatState = {
  activeConversationId: GENERAL_CONVERSATION_ID,
  unread: {},
  sidebarOpen: false,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    conversationOpened(state, action: PayloadAction<string>) {
      state.activeConversationId = action.payload;
      state.sidebarOpen = false;
      delete state.unread[action.payload];
    },
    incomingMessage(state, action: PayloadAction<string>) {
      if (action.payload === state.activeConversationId) return;
      state.unread[action.payload] = (state.unread[action.payload] ?? 0) + 1;
    },
    sidebarToggled(state, action: PayloadAction<boolean | undefined>) {
      state.sidebarOpen = action.payload ?? !state.sidebarOpen;
    },
  },
});

export const { conversationOpened, incomingMessage, sidebarToggled } = chatSlice.actions;

export const selectActiveConversationId = (state: RootState) => state.chat.activeConversationId;
export const selectUnread = (state: RootState) => state.chat.unread;
export const selectSidebarOpen = (state: RootState) => state.chat.sidebarOpen;
export const selectTotalUnread = (state: RootState) =>
  Object.values(state.chat.unread).reduce((total, count) => total + count, 0);

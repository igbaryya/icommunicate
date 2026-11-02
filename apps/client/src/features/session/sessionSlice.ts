import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { api } from '@/services/api';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface SessionState {
  connection: ConnectionStatus;
}

const initialState: SessionState = { connection: 'connecting' };

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    connectionChanged(state, action: PayloadAction<ConnectionStatus>) {
      state.connection = action.payload;
    },
  },
});

export const { connectionChanged } = sessionSlice.actions;

export const selectConnection = (state: RootState) => state.session.connection;
export const selectIsConnected = (state: RootState) => state.session.connection === 'connected';
export const selectMe = (state: RootState) => api.endpoints.getSession.select()(state).data?.device;

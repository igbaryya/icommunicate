import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from '@/services/api';
import { chatSlice } from '@/features/chat/chatSlice';
import { sessionSlice } from '@/features/session/sessionSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [sessionSlice.name]: sessionSlice.reducer,
    [chatSlice.name]: chatSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

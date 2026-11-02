import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  API_PREFIX,
  MESSAGES_PAGE_SIZE,
  SocketEvent,
  type Conversation,
  type Device,
  type Message,
  type OpenDmPayload,
  type SendMessagePayload,
  type ServerInfo,
  type Session,
} from '@icommunicate/shared';
import { emitWithAck } from './socket';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: API_PREFIX }),
  tagTypes: ['Session', 'ServerInfo', 'Device', 'Conversation', 'Message'],
  endpoints: (build) => ({
    getServerInfo: build.query<ServerInfo, void>({
      query: () => 'info',
      providesTags: ['ServerInfo'],
    }),

    getSession: build.query<Session, void>({
      query: () => 'session',
      providesTags: ['Session'],
    }),

    getDevices: build.query<Device[], void>({
      query: () => 'devices',
      providesTags: ['Device'],
    }),

    getConversations: build.query<Conversation[], void>({
      query: () => 'conversations',
      providesTags: ['Conversation'],
    }),

    /** Page 0 is the newest; each next page is older. Each page is chronological. */
    getMessages: build.infiniteQuery<Message[], string, number>({
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.length < MESSAGES_PAGE_SIZE ? undefined : lastPage[0]?.seq),
      },
      query: ({ queryArg, pageParam }) => ({
        url: `conversations/${queryArg}/messages`,
        params: pageParam ? { before: pageParam } : undefined,
      }),
      providesTags: (_result, _error, conversationId) => [{ type: 'Message', id: conversationId }],
    }),

    sendMessage: build.mutation<Message, SendMessagePayload>({
      queryFn: (payload) => emitWithAck(SocketEvent.MessageSend, payload),
    }),

    openDm: build.mutation<Conversation, OpenDmPayload>({
      queryFn: (payload) => emitWithAck(SocketEvent.ConversationOpenDm, payload),
    }),
  }),
});

export const {
  useGetServerInfoQuery,
  useGetSessionQuery,
  useGetDevicesQuery,
  useGetConversationsQuery,
  useGetMessagesInfiniteQuery,
  useSendMessageMutation,
  useOpenDmMutation,
} = api;

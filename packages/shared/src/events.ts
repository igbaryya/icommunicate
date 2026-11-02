import type { Conversation, Device, Message } from './types';

export const SocketEvent = {
  MessageSend: 'message:send',
  MessageNew: 'message:new',
  ConversationOpenDm: 'conversation:openDm',
  ConversationUpsert: 'conversation:upsert',
  DeviceUpsert: 'device:upsert',
  DeviceRename: 'device:rename',
} as const;

export type Ack<T> = { ok: true; data: T } | { ok: false; error: string };

export interface SendMessagePayload {
  conversationId: string;
  body: string;
  attachmentIds: string[];
}

export interface OpenDmPayload {
  deviceId: string;
}

export interface RenameDevicePayload {
  hostname: string;
}

export interface ServerToClientEvents {
  [SocketEvent.MessageNew]: (message: Message) => void;
  [SocketEvent.ConversationUpsert]: (conversation: Conversation) => void;
  [SocketEvent.DeviceUpsert]: (device: Device) => void;
}

export interface ClientToServerEvents {
  [SocketEvent.MessageSend]: (payload: SendMessagePayload, ack: (res: Ack<Message>) => void) => void;
  [SocketEvent.ConversationOpenDm]: (payload: OpenDmPayload, ack: (res: Ack<Conversation>) => void) => void;
  [SocketEvent.DeviceRename]: (payload: RenameDevicePayload, ack: (res: Ack<Device>) => void) => void;
}

export type AckEventName = keyof ClientToServerEvents;
export type AckPayload<E extends AckEventName> = Parameters<ClientToServerEvents[E]>[0];
export type AckResult<E extends AckEventName> =
  Parameters<Parameters<ClientToServerEvents[E]>[1]>[0] extends Ack<infer R> ? R : never;

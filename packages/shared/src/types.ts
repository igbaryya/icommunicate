export interface Device {
  id: string;
  ip: string;
  hostname: string;
  firstSeenAt: number;
  lastSeenAt: number;
  online: boolean;
}

export type ConversationType = 'channel' | 'dm';

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  memberIds: string[];
  createdAt: number;
  lastMessageAt: number | null;
}

export interface Attachment {
  id: string;
  messageId: string | null;
  name: string;
  mimeType: string;
  size: number;
  createdAt: number;
}

export interface Message {
  seq: number;
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: number;
  attachments: Attachment[];
}

export interface Session {
  device: Device;
}

export interface ServerInfo {
  hostname: string;
  addresses: string[];
  port: number;
  startedAt: number;
  maxFileSizeBytes: number;
}

export interface ApiErrorBody {
  error: string;
}

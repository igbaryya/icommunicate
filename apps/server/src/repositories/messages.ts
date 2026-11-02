import { randomUUID } from 'node:crypto';
import type { Message } from '@icommunicate/shared';
import { db } from '../db';
import { AppError } from '../utils/AppError';
import { attachmentsRepository } from './attachments';
import { conversationsRepository } from './conversations';

interface MessageRow {
  seq: number;
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: number;
}

export interface NewMessage {
  conversationId: string;
  senderId: string;
  body: string;
  attachmentIds: string[];
}

const statements = {
  page: db.prepare<[string, number, number], MessageRow>(`
    SELECT * FROM messages
    WHERE conversation_id = ? AND seq < ?
    ORDER BY seq DESC
    LIMIT ?`),
  findById: db.prepare<[string], MessageRow>('SELECT * FROM messages WHERE id = ?'),
  insert: db.prepare<[string, string, string, string, number]>(
    'INSERT INTO messages (id, conversation_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)',
  ),
};

function withAttachments(rows: MessageRow[]): Message[] {
  const attachments = attachmentsRepository.listByMessageIds(rows.map((row) => row.id));
  return rows.map((row) => ({
    seq: row.seq,
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    attachments: attachments.filter((attachment) => attachment.messageId === row.id),
  }));
}

export const messagesRepository = {
  /** Returns up to `limit` messages older than `beforeSeq`, in chronological order. */
  listPage(conversationId: string, beforeSeq: number | undefined, limit: number) {
    const rows = statements.page.all(conversationId, beforeSeq ?? Number.MAX_SAFE_INTEGER, limit);
    return withAttachments(rows.reverse());
  },

  create: db.transaction((input: NewMessage): Message => {
    const id = randomUUID();
    const now = Date.now();
    statements.insert.run(id, input.conversationId, input.senderId, input.body, now);

    input.attachmentIds.forEach((attachmentId) => {
      if (!attachmentsRepository.linkToMessage(attachmentId, id, input.senderId)) {
        throw new AppError(400, 'One or more attachments are invalid or already sent');
      }
    });

    conversationsRepository.touchLastMessage(input.conversationId, now);
    return withAttachments([statements.findById.get(id)!])[0]!;
  }),
};

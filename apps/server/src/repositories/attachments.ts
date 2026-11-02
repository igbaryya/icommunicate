import { randomUUID } from 'node:crypto';
import type { Attachment } from '@icommunicate/shared';
import { db } from '../db';

interface AttachmentRow {
  id: string;
  message_id: string | null;
  uploader_id: string;
  original_name: string;
  mime_type: string;
  size: number;
  storage_path: string;
  created_at: number;
}

export interface AttachmentFileRecord {
  attachment: Attachment;
  uploaderId: string;
  storagePath: string;
  conversationId: string | null;
}

export interface NewAttachment {
  uploaderId: string;
  name: string;
  mimeType: string;
  size: number;
  storagePath: string;
}

const toAttachment = (row: AttachmentRow): Attachment => ({
  id: row.id,
  messageId: row.message_id,
  name: row.original_name,
  mimeType: row.mime_type,
  size: row.size,
  createdAt: row.created_at,
});

const statements = {
  insert: db.prepare<[string, string, string, string, number, string, number]>(`
    INSERT INTO attachments (id, uploader_id, original_name, mime_type, size, storage_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`),
  findFile: db.prepare<[string], AttachmentRow & { conversation_id: string | null }>(`
    SELECT a.*, m.conversation_id
    FROM attachments a
    LEFT JOIN messages m ON m.id = a.message_id
    WHERE a.id = ?`),
  listByMessageIds: db.prepare<[string], AttachmentRow>(`
    SELECT * FROM attachments
    WHERE message_id IN (SELECT value FROM json_each(?))
    ORDER BY created_at`),
  link: db.prepare<[string, string, string]>(`
    UPDATE attachments SET message_id = ?
    WHERE id = ? AND uploader_id = ? AND message_id IS NULL`),
  listOrphansBefore: db.prepare<[number], AttachmentRow>(
    'SELECT * FROM attachments WHERE message_id IS NULL AND created_at < ?',
  ),
  delete: db.prepare<[string]>('DELETE FROM attachments WHERE id = ?'),
};

export const attachmentsRepository = {
  create(input: NewAttachment): Attachment {
    const id = randomUUID();
    const now = Date.now();
    statements.insert.run(id, input.uploaderId, input.name, input.mimeType, input.size, input.storagePath, now);
    return { id, messageId: null, name: input.name, mimeType: input.mimeType, size: input.size, createdAt: now };
  },

  findFile(id: string): AttachmentFileRecord | null {
    const row = statements.findFile.get(id);
    if (!row) return null;
    return {
      attachment: toAttachment(row),
      uploaderId: row.uploader_id,
      storagePath: row.storage_path,
      conversationId: row.conversation_id,
    };
  },

  listByMessageIds(messageIds: string[]) {
    if (!messageIds.length) return [];
    return statements.listByMessageIds.all(JSON.stringify(messageIds)).map(toAttachment);
  },

  /** Returns false when the attachment does not exist, is not owned by the uploader, or is already linked. */
  linkToMessage(id: string, messageId: string, uploaderId: string) {
    return statements.link.run(messageId, id, uploaderId).changes === 1;
  },

  listOrphansBefore(timestamp: number) {
    return statements.listOrphansBefore.all(timestamp).map((row) => ({ id: row.id, storagePath: row.storage_path }));
  },

  delete(id: string) {
    statements.delete.run(id);
  },
};

import { randomUUID } from 'node:crypto';
import type { Conversation, ConversationType } from '@icommunicate/shared';
import { db } from '../db';

interface ConversationRow {
  id: string;
  type: ConversationType;
  name: string | null;
  created_at: number;
  last_message_at: number | null;
  member_ids: string | null;
}

const toConversation = (row: ConversationRow): Conversation => ({
  id: row.id,
  type: row.type,
  name: row.name,
  memberIds: row.member_ids ? row.member_ids.split(',') : [],
  createdAt: row.created_at,
  lastMessageAt: row.last_message_at,
});

const SELECT_CONVERSATION = `
  SELECT c.id, c.type, c.name, c.created_at, c.last_message_at,
         (SELECT group_concat(m.device_id) FROM conversation_members m WHERE m.conversation_id = c.id) AS member_ids
  FROM conversations c`;

const statements = {
  findById: db.prepare<[string], ConversationRow>(`${SELECT_CONVERSATION} WHERE c.id = ?`),
  findByDmKey: db.prepare<[string], ConversationRow>(`${SELECT_CONVERSATION} WHERE c.dm_key = ?`),
  listForDevice: db.prepare<[string], ConversationRow>(`
    ${SELECT_CONVERSATION}
    WHERE c.type = 'channel'
       OR EXISTS (SELECT 1 FROM conversation_members m WHERE m.conversation_id = c.id AND m.device_id = ?)
    ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`),
  insert: db.prepare<[string, ConversationType, string | null, string | null, number]>(
    'INSERT INTO conversations (id, type, name, dm_key, created_at) VALUES (?, ?, ?, ?, ?)',
  ),
  insertMember: db.prepare<[string, string]>(
    'INSERT INTO conversation_members (conversation_id, device_id) VALUES (?, ?)',
  ),
  touchLastMessage: db.prepare<[number, string]>('UPDATE conversations SET last_message_at = ? WHERE id = ?'),
};

const toDmKey = (deviceIds: string[]) => [...deviceIds].sort().join(':');

export const conversationsRepository = {
  findById(id: string) {
    const row = statements.findById.get(id);
    return row ? toConversation(row) : null;
  },

  listForDevice(deviceId: string) {
    return statements.listForDevice.all(deviceId).map(toConversation);
  },

  findDm(deviceIds: string[]) {
    const row = statements.findByDmKey.get(toDmKey(deviceIds));
    return row ? toConversation(row) : null;
  },

  createDm: db.transaction((deviceIds: string[]): Conversation => {
    const id = randomUUID();
    statements.insert.run(id, 'dm', null, toDmKey(deviceIds), Date.now());
    deviceIds.forEach((deviceId) => statements.insertMember.run(id, deviceId));
    return conversationsRepository.findById(id)!;
  }),

  touchLastMessage(id: string, at: number) {
    statements.touchLastMessage.run(at, id);
  },
};

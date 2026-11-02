import { randomUUID } from 'node:crypto';
import type { Device } from '@icommunicate/shared';
import { db } from '../db';

export type DeviceRecord = Omit<Device, 'online'> & { nameCustom: boolean };

interface DeviceRow {
  id: string;
  ip: string;
  hostname: string;
  name_custom: number;
  first_seen_at: number;
  last_seen_at: number;
}

const toRecord = (row: DeviceRow): DeviceRecord => ({
  id: row.id,
  ip: row.ip,
  hostname: row.hostname,
  nameCustom: row.name_custom === 1,
  firstSeenAt: row.first_seen_at,
  lastSeenAt: row.last_seen_at,
});

interface IdRow {
  id: string;
}

interface TypeRow {
  type: string;
}

interface MemberRow {
  device_id: string;
  conversation_id: string;
}

interface CountRow {
  c: number;
}

const statements = {
  findById: db.prepare<[string], DeviceRow>('SELECT * FROM devices WHERE id = ?'),
  findByIp: db.prepare<[string], DeviceRow>('SELECT * FROM devices WHERE ip = ?'),
  list: db.prepare<[], DeviceRow>('SELECT * FROM devices ORDER BY hostname COLLATE NOCASE'),
  insert: db.prepare<[string, string, string, number, number]>(
    'INSERT INTO devices (id, ip, hostname, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?, ?)',
  ),
  updateHostname: db.prepare<[string, string]>('UPDATE devices SET hostname = ? WHERE id = ?'),
  rename: db.prepare<[string, string]>('UPDATE devices SET hostname = ?, name_custom = 1 WHERE id = ?'),
  updateIp: db.prepare<[string, string]>('UPDATE devices SET ip = ? WHERE id = ?'),
  touch: db.prepare<[number, string]>('UPDATE devices SET last_seen_at = ? WHERE id = ?'),
  deleteById: db.prepare<[string]>('DELETE FROM devices WHERE id = ?'),
  reassignMessages: db.prepare<[string, string]>('UPDATE messages SET sender_id = ? WHERE sender_id = ?'),
  reassignUploads: db.prepare<[string, string]>('UPDATE attachments SET uploader_id = ? WHERE uploader_id = ?'),
  membershipsByDevice: db.prepare<[string], MemberRow>(
    'SELECT conversation_id, device_id FROM conversation_members WHERE device_id = ?',
  ),
  findMember: db.prepare<[string, string], MemberRow>(
    'SELECT conversation_id, device_id FROM conversation_members WHERE conversation_id = ? AND device_id = ?',
  ),
  memberIds: db.prepare<[string], MemberRow>('SELECT conversation_id, device_id FROM conversation_members WHERE conversation_id = ?'),
  deleteMember: db.prepare<[string, string]>('DELETE FROM conversation_members WHERE conversation_id = ? AND device_id = ?'),
  moveMember: db.prepare<[string, string, string]>(
    'UPDATE conversation_members SET device_id = ? WHERE conversation_id = ? AND device_id = ?',
  ),
  insertMember: db.prepare<[string, string]>('INSERT INTO conversation_members (conversation_id, device_id) VALUES (?, ?)'),
  conversationType: db.prepare<[string], TypeRow>('SELECT type FROM conversations WHERE id = ?'),
  findDmId: db.prepare<[string], IdRow>('SELECT id FROM conversations WHERE dm_key = ?'),
  setDmKey: db.prepare<[string | null, string]>('UPDATE conversations SET dm_key = ? WHERE id = ?'),
  countMessages: db.prepare<[string], CountRow>('SELECT count(*) AS c FROM messages WHERE conversation_id = ?'),
  moveMessages: db.prepare<[string, string]>('UPDATE messages SET conversation_id = ? WHERE conversation_id = ?'),
  deleteConversation: db.prepare<[string]>('DELETE FROM conversations WHERE id = ?'),
};

/** A direct message left with one member, or two rows for the same pair, cannot stay that way. */
function settleConversation(conversationId: string) {
  const conversation = statements.conversationType.get(conversationId);
  if (conversation?.type !== 'dm') return;

  const memberIds = statements.memberIds
    .all(conversationId)
    .map((row) => row.device_id)
    .sort();

  if (memberIds.length < 2) {
    if (statements.countMessages.get(conversationId)?.c) statements.setDmKey.run(null, conversationId);
    else statements.deleteConversation.run(conversationId);
    return;
  }

  const dmKey = memberIds.join(':');
  const existing = statements.findDmId.get(dmKey);
  if (existing && existing.id !== conversationId) {
    statements.moveMessages.run(existing.id, conversationId);
    memberIds.forEach((memberId) => {
      if (!statements.findMember.get(existing.id, memberId)) statements.insertMember.run(existing.id, memberId);
    });
    statements.deleteConversation.run(conversationId);
    return;
  }

  statements.setDmKey.run(dmKey, conversationId);
}

function absorbDuplicate(keeperId: string, duplicateId: string) {
  statements.reassignMessages.run(keeperId, duplicateId);
  statements.reassignUploads.run(keeperId, duplicateId);

  const conversationIds = statements.membershipsByDevice.all(duplicateId).map((row) => row.conversation_id);
  conversationIds.forEach((conversationId) => {
    if (statements.findMember.get(conversationId, keeperId)) statements.deleteMember.run(conversationId, duplicateId);
    else statements.moveMember.run(keeperId, conversationId, duplicateId);
  });
  conversationIds.forEach(settleConversation);
  statements.deleteById.run(duplicateId);
}

export const devicesRepository = {
  findById(id: string) {
    const row = statements.findById.get(id);
    return row ? toRecord(row) : null;
  },

  findByIp(ip: string) {
    const row = statements.findByIp.get(ip);
    return row ? toRecord(row) : null;
  },

  list() {
    return statements.list.all().map(toRecord);
  },

  create(ip: string, hostname: string): DeviceRecord {
    const now = Date.now();
    const id = randomUUID();
    statements.insert.run(id, ip, hostname, now, now);
    return { id, ip, hostname, nameCustom: false, firstSeenAt: now, lastSeenAt: now };
  },

  updateHostname(id: string, hostname: string) {
    statements.updateHostname.run(hostname, id);
    return devicesRepository.findById(id);
  },

  /** Owner-chosen name. Hostname lookup must not replace it. */
  rename(id: string, hostname: string) {
    statements.rename.run(hostname, id);
    return devicesRepository.findById(id);
  },

  touch(id: string, at = Date.now()) {
    statements.touch.run(at, id);
  },

  /** Keeps one device row for this machine and folds the others into it. */
  adoptHost(keeperId: string, ip: string, duplicateIds: string[]) {
    db.transaction(() => {
      statements.updateIp.run(ip, keeperId);
      duplicateIds.forEach((duplicateId) => absorbDuplicate(keeperId, duplicateId));
    })();
  },
};

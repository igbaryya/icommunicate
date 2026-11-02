import type { Database } from 'better-sqlite3';
import { GENERAL_CONVERSATION_ID } from '@icommunicate/shared';

const migrations: string[] = [
  `
  CREATE TABLE devices (
    id            TEXT PRIMARY KEY,
    ip            TEXT NOT NULL UNIQUE,
    hostname      TEXT NOT NULL,
    first_seen_at INTEGER NOT NULL,
    last_seen_at  INTEGER NOT NULL
  );

  CREATE TABLE conversations (
    id              TEXT PRIMARY KEY,
    type            TEXT NOT NULL CHECK (type IN ('channel', 'dm')),
    name            TEXT,
    dm_key          TEXT UNIQUE,
    created_at      INTEGER NOT NULL,
    last_message_at INTEGER
  );

  CREATE TABLE conversation_members (
    conversation_id TEXT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    device_id       TEXT NOT NULL REFERENCES devices (id) ON DELETE CASCADE,
    PRIMARY KEY (conversation_id, device_id)
  );

  CREATE TABLE messages (
    seq             INTEGER PRIMARY KEY AUTOINCREMENT,
    id              TEXT NOT NULL UNIQUE,
    conversation_id TEXT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    sender_id       TEXT NOT NULL REFERENCES devices (id),
    body            TEXT NOT NULL DEFAULT '',
    created_at      INTEGER NOT NULL
  );
  CREATE INDEX idx_messages_conversation ON messages (conversation_id, seq);

  CREATE TABLE attachments (
    id            TEXT PRIMARY KEY,
    message_id    TEXT REFERENCES messages (id) ON DELETE CASCADE,
    uploader_id   TEXT NOT NULL REFERENCES devices (id),
    original_name TEXT NOT NULL,
    mime_type     TEXT NOT NULL,
    size          INTEGER NOT NULL,
    storage_path  TEXT NOT NULL,
    created_at    INTEGER NOT NULL
  );
  CREATE INDEX idx_attachments_message ON attachments (message_id);

  INSERT INTO conversations (id, type, name, created_at)
  VALUES ('${GENERAL_CONVERSATION_ID}', 'channel', 'general', CAST(strftime('%s', 'now') AS INTEGER) * 1000);
  `,
  `
  ALTER TABLE devices ADD COLUMN name_custom INTEGER NOT NULL DEFAULT 0;
  `,
];

export function runMigrations(db: Database) {
  const current = db.pragma('user_version', { simple: true }) as number;

  migrations.slice(current).forEach((sql, index) => {
    db.transaction(() => {
      db.exec(sql);
      db.pragma(`user_version = ${current + index + 1}`);
    })();
  });
}

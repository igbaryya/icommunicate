import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config';
import { runMigrations } from './migrations';

fs.mkdirSync(path.dirname(config.paths.database), { recursive: true });

export const db = new Database(config.paths.database);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

runMigrations(db);

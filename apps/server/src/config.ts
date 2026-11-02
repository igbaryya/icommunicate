import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { DEFAULT_PORT } from '@icommunicate/shared';

// Both src/ (dev) and dist/ (build) sit two levels below the repo root.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

dotenv.config({ path: path.join(repoRoot, '.env'), quiet: true });

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const toBool = (value: string | undefined, fallback: boolean) =>
  value === undefined ? fallback : ['1', 'true', 'yes'].includes(value.toLowerCase());

const storageDir = path.resolve(repoRoot, process.env.STORAGE_DIR ?? 'storage');

export const config = {
  host: process.env.HOST ?? '0.0.0.0',
  port: toPositiveInt(process.env.PORT, DEFAULT_PORT),
  maxFileSizeBytes: toPositiveInt(process.env.MAX_FILE_SIZE_MB, 100) * 1024 * 1024,
  lanOnly: toBool(process.env.LAN_ONLY, true),
  paths: {
    storage: storageDir,
    database: path.join(storageDir, 'db', 'icommunicate.sqlite'),
    attachments: path.join(storageDir, 'attachments'),
    clientDist: path.join(repoRoot, 'apps', 'client', 'dist'),
  },
} as const;

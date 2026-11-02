import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config';

const root = config.paths.attachments;

/** Busboy decodes multipart filenames as latin1; browsers send UTF-8. */
const decodeFilename = (name: string) => Buffer.from(name, 'latin1').toString('utf8');

export function sanitizeFilename(rawName: string) {
  const name = path
    .basename(decodeFilename(rawName))
    .replace(/[\u0000-\u001f<>:"/\\|?*]/g, '_')
    .trim()
    .slice(0, 255);
  return name || 'file';
}

const safeExtension = (name: string) =>
  path
    .extname(name)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '')
    .slice(0, 16);

export const storageService = {
  root,

  ensureRoot() {
    fs.mkdirSync(root, { recursive: true });
  },

  /** Attachments are laid out as `<root>/<yyyy>/<mm>/<uuid><ext>`. */
  currentDirectory() {
    const now = new Date();
    const directory = path.join(root, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
    fs.mkdirSync(directory, { recursive: true });
    return directory;
  },

  createFilename: (originalName: string) => `${randomUUID()}${safeExtension(originalName)}`,

  /** Stored paths are relative to the root and always use `/`. */
  toRelative: (absolutePath: string) => path.relative(root, absolutePath).split(path.sep).join('/'),

  async remove(relativePath: string) {
    const absolute = path.resolve(root, relativePath);
    if (!absolute.startsWith(root + path.sep)) return;
    await fs.promises.rm(absolute, { force: true });
  },
};

import { attachmentsRepository } from '../repositories/attachments';
import { storageService } from './storage';

const ORPHAN_TTL_MS = 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 30 * 60 * 1000;

/** Removes uploads that were never attached to a sent message (cancelled or abandoned composers). */
async function sweepOrphans() {
  const orphans = attachmentsRepository.listOrphansBefore(Date.now() - ORPHAN_TTL_MS);
  for (const orphan of orphans) {
    await storageService.remove(orphan.storagePath);
    attachmentsRepository.delete(orphan.id);
  }
  if (orphans.length) console.log(`[cleanup] removed ${orphans.length} orphaned upload(s)`);
}

export function startOrphanCleanup() {
  const run = () => sweepOrphans().catch((error) => console.error('[cleanup] failed', error));
  run();
  setInterval(run, SWEEP_INTERVAL_MS).unref();
}

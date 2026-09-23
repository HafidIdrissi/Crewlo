import { lstatSync, mkdirSync, realpathSync, renameSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

/** Isolated CODEX_HOMEs must not provision competing credentials for the same
 * machine-wide Windows sandbox users. Share the entire provisioning state,
 * including protected credentials, without copying or reading those secrets.
 * Existing state is retained for recovery; junctions preserve target ACLs. */
export function shareCodexWindowsSandbox(home: string, userHome: string): void {
  if (process.platform !== 'win32' || resolve(home).toLowerCase() === resolve(userHome).toLowerCase()) return;
  mkdirSync(home, { recursive: true });
  for (const name of ['.sandbox', '.sandbox-secrets', '.sandbox-bin']) {
    const target = join(userHome, name);
    const destination = join(home, name);
    mkdirSync(target, { recursive: true });
    let existing;
    try { existing = lstatSync(destination); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    if (existing?.isSymbolicLink()) {
      if (realpathSync(destination).toLowerCase() === realpathSync(target).toLowerCase()) continue;
      throw new Error(`Unexpected Codex sandbox link: ${destination}`);
    }
    const backup = existing ? `${destination}.crewlo-backup-${randomUUID()}` : undefined;
    if (backup) renameSync(destination, backup);
    try { symlinkSync(target, destination, 'junction'); }
    catch (error) {
      if (backup) renameSync(backup, destination);
      throw error;
    }
  }
}

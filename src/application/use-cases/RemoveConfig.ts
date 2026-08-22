import { ConfigRepository } from '../../domain/ports/ConfigRepository';
import { SyncService } from '../../domain/ports/SyncService';

export interface RemoveConfigResult {
  /** false when the remote (Supabase) delete failed — item will reappear on next sync */
  remoteDeleted: boolean;
}

/**
 * Deletes configuration items (departments, shifts, rooms) both locally and
 * in Supabase so the next sync does not resurrect them. Mirrors the
 * RemoveWorkerUseCase pattern: local removal always succeeds, remote
 * deletion is best-effort and its outcome is reported to the caller.
 */
export class RemoveConfigUseCase {
  constructor(
    private readonly configRepository: ConfigRepository,
    private readonly syncService: SyncService
  ) {}

  async removeDepartment(name: string): Promise<RemoveConfigResult> {
    let remoteDeleted = true;
    try {
      await this.syncService.deleteDepartment(name);
    } catch (error) {
      console.error('Remote department delete skipped:', error);
      remoteDeleted = false;
    }
    await this.configRepository.removeDepartment(name);
    return { remoteDeleted };
  }

  async removeShift(id: string): Promise<RemoveConfigResult> {
    let remoteDeleted = true;
    try {
      await this.syncService.deleteShift(id);
    } catch (error) {
      console.error('Remote shift delete skipped:', error);
      remoteDeleted = false;
    }
    await this.configRepository.removeShift(id);
    return { remoteDeleted };
  }

  async removeRoom(id: string): Promise<RemoveConfigResult> {
    let remoteDeleted = true;
    try {
      await this.syncService.deleteRoom(id);
    } catch (error) {
      console.error('Remote room delete skipped:', error);
      remoteDeleted = false;
    }
    await this.configRepository.removeRoom(id);
    return { remoteDeleted };
  }
}

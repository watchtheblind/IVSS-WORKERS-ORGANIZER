import { WorkerRepository } from '../../domain/ports/WorkerRepository';
import { SyncService } from '../../domain/ports/SyncService';

let syncInProgress = false;

export class SyncWorkersUseCase {
  constructor(
    private readonly workerRepository: WorkerRepository,
    private readonly syncService: SyncService
  ) {}

  async execute(): Promise<{ pushed: number; pulled: number }> {
    if (syncInProgress) {
      return { pushed: 0, pulled: 0 };
    }
    syncInProgress = true;
    try {
      // --- Push Phase ---
      const unsyncedWorkers = await this.workerRepository.getUnsyncedWorkers();
      let pushed = 0;

      for (const worker of unsyncedWorkers) {
        try {
          const remoteWorker = await this.syncService.pushWorker(worker);
          await this.workerRepository.updateWorkerSyncStatus(
            worker.id!,
            remoteWorker.id
          );
          pushed++;
        } catch (error) {
          console.error(`Failed to push worker ${worker.id}:`, error);
        }
      }

      // --- Pull Phase ---
      let pulled = 0;
      try {
        const remoteWorkers = await this.syncService.pullWorkers();
        for (const remote of remoteWorkers) {
          await this.workerRepository.upsertWorkerBySupabaseId({
            supabase_id: remote.id,
            full_name: remote.full_name,
            position: remote.position,
          });
          pulled++;
        }
      } catch (error) {
        console.error('Failed to pull remote workers:', error);
      }

      return { pushed, pulled };
    } finally {
      syncInProgress = false;
    }
  }
}

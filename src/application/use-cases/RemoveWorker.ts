import { WorkerRepository } from '../../domain/ports/WorkerRepository';
import { SyncService } from '../../domain/ports/SyncService';
import { Worker } from '../../domain/entities/Worker';

export class RemoveWorkerUseCase {
  constructor(
    private readonly workerRepository: WorkerRepository,
    private readonly syncService: SyncService
  ) {}

  async execute(worker: Worker): Promise<void> {
    await this.workerRepository.removeWorker(worker.id!);
    if (worker.supabase_id) {
      try {
        await this.syncService.deleteWorker(worker.supabase_id);
      } catch (error) {
        console.error('Remote worker delete skipped:', error);
      }
    }
  }
}
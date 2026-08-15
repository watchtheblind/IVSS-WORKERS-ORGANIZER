import { Worker, NewWorker } from '../entities/Worker';

export interface WorkerRepository {
  addWorker(worker: NewWorker): Promise<Worker>;
  getWorkers(): Promise<Worker[]>;
  getUnsyncedWorkers(): Promise<Worker[]>;
  updateWorkerSyncStatus(id: number, supabaseId: string): Promise<void>;
  upsertWorkerBySupabaseId(worker: Omit<Worker, 'id' | 'synced'>): Promise<void>;
}

import { Worker } from '../entities/Worker';

export interface RemoteWorker {
  id: string;
  full_name: string;
  position: string;
  created_at: string;
}

export interface SyncService {
  pushWorker(worker: Worker): Promise<RemoteWorker>;
  pullWorkers(): Promise<RemoteWorker[]>;
}

import { SQLiteWorkerRepository } from './infrastructure/adapters/SQLiteWorkerRepository';
import { SupabaseSyncService } from './infrastructure/adapters/SupabaseSyncService';
import { ViewShotImageService } from './infrastructure/adapters/ViewShotImageService';
import { ExpoShareService } from './infrastructure/adapters/ExpoShareService';
import { NetworkListener } from './infrastructure/network/NetworkListener';
import { AddWorkerUseCase } from './application/use-cases/AddWorker';
import { GetWorkersUseCase } from './application/use-cases/GetWorkers';
import { SyncWorkersUseCase } from './application/use-cases/SyncWorkers';
import { GenerateReportImageUseCase } from './application/use-cases/GenerateReportImage';

// --- Driven Adapters (Infrastructure) ---
const workerRepository = new SQLiteWorkerRepository();
const syncService = new SupabaseSyncService();
const imageService = new ViewShotImageService();
const shareService = new ExpoShareService();
const networkListener = new NetworkListener();

// --- Application Use Cases ---
const addWorkerUseCase = new AddWorkerUseCase(workerRepository);
const getWorkersUseCase = new GetWorkersUseCase(workerRepository);
const syncWorkersUseCase = new SyncWorkersUseCase(workerRepository, syncService);
const generateReportImageUseCase = new GenerateReportImageUseCase(imageService, shareService);

export const container = {
  // Adapters
  workerRepository,
  syncService,
  imageService,
  shareService,
  networkListener,

  // Use Cases
  addWorkerUseCase,
  getWorkersUseCase,
  syncWorkersUseCase,
  generateReportImageUseCase,
};

export type Container = typeof container;

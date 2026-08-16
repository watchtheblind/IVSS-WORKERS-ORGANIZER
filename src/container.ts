import { SQLiteWorkerRepository } from './infrastructure/adapters/SQLiteWorkerRepository';
import { SQLiteConfigRepository } from './infrastructure/adapters/SQLiteConfigRepository';
import { SupabaseSyncService } from './infrastructure/adapters/SupabaseSyncService';
import { ViewShotImageService } from './infrastructure/adapters/ViewShotImageService';
import { ExpoShareService } from './infrastructure/adapters/ExpoShareService';
import { NetworkListener } from './infrastructure/network/NetworkListener';
import { AddWorkerUseCase } from './application/use-cases/AddWorker';
import { GetWorkersUseCase } from './application/use-cases/GetWorkers';
import { RemoveWorkerUseCase } from './application/use-cases/RemoveWorker';
import { SyncWorkersUseCase } from './application/use-cases/SyncWorkers';
import { SyncConfigUseCase } from './application/use-cases/SyncConfig';
import { GenerateReportImageUseCase } from './application/use-cases/GenerateReportImage';

// --- Driven Adapters (Infrastructure) ---
const workerRepository = new SQLiteWorkerRepository();
const configRepository = new SQLiteConfigRepository();
const syncService = new SupabaseSyncService();
const imageService = new ViewShotImageService();
const shareService = new ExpoShareService();
const networkListener = new NetworkListener();

// --- Application Use Cases ---
const addWorkerUseCase = new AddWorkerUseCase(workerRepository);
const getWorkersUseCase = new GetWorkersUseCase(workerRepository);
const removeWorkerUseCase = new RemoveWorkerUseCase(workerRepository, syncService);
const syncWorkersUseCase = new SyncWorkersUseCase(workerRepository, syncService);
const syncConfigUseCase = new SyncConfigUseCase(configRepository, syncService);
const generateReportImageUseCase = new GenerateReportImageUseCase(imageService, shareService);

export const container = {
  // Adapters
  workerRepository,
  configRepository,
  syncService,
  imageService,
  shareService,
  networkListener,

  // Use Cases
  addWorkerUseCase,
  getWorkersUseCase,
  removeWorkerUseCase,
  syncWorkersUseCase,
  syncConfigUseCase,
  generateReportImageUseCase,
};

export type Container = typeof container;

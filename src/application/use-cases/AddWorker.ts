import { Worker, NewWorker } from '../../domain/entities/Worker';
import { WorkerRepository } from '../../domain/ports/WorkerRepository';

export class AddWorkerUseCase {
  constructor(private readonly workerRepository: WorkerRepository) {}

  async execute(workerData: NewWorker): Promise<Worker> {
    return this.workerRepository.addWorker(workerData);
  }
}

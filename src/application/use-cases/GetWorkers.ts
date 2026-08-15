import { Worker } from '../../domain/entities/Worker';
import { WorkerRepository } from '../../domain/ports/WorkerRepository';

export class GetWorkersUseCase {
  constructor(private readonly workerRepository: WorkerRepository) {}

  async execute(): Promise<Worker[]> {
    return this.workerRepository.getWorkers();
  }
}

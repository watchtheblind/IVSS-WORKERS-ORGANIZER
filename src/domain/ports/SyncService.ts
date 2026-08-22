import { Worker } from '../entities/Worker';
import { ShiftConfig, RoomConfig } from '../constants/appConfig';

export interface RemoteWorker {
  id: string;
  full_name: string;
  position: string;
  created_at: string;
}

export interface SyncService {
  pushWorker(worker: Worker): Promise<RemoteWorker>;
  pullWorkers(): Promise<RemoteWorker[]>;
  deleteWorker(supabaseId: string): Promise<void>;
  pushDepartments(names: string[]): Promise<void>;
  pullDepartments(): Promise<string[]>;
  deleteDepartment(name: string): Promise<void>;
  pushShifts(shifts: ShiftConfig[]): Promise<void>;
  pullShifts(): Promise<ShiftConfig[]>;
  deleteShift(id: string): Promise<void>;
  pushRooms(rooms: RoomConfig[]): Promise<void>;
  pullRooms(): Promise<RoomConfig[]>;
  deleteRoom(id: string): Promise<void>;
  pushSettings(settings: Record<string, string>): Promise<void>;
  pullSettings(): Promise<Record<string, string>>;
}
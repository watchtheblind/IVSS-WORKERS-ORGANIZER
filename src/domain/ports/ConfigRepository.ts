import { ShiftConfig, RoomConfig } from '../constants/appConfig';

export interface ConfigRepository {
  getDepartments(): Promise<string[]>;
  addDepartment(name: string): Promise<string[]>;
  removeDepartment(name: string): Promise<string[]>;
  getShifts(): Promise<ShiftConfig[]>;
  addShift(shift: ShiftConfig): Promise<ShiftConfig[]>;
  removeShift(id: string): Promise<ShiftConfig[]>;
  getRooms(department?: string): Promise<RoomConfig[]>;
  addRoom(room: RoomConfig): Promise<RoomConfig[]>;
  updateRoom(room: RoomConfig): Promise<RoomConfig[]>;
  removeRoom(id: string): Promise<RoomConfig[]>;
}

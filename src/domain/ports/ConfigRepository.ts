import { ShiftConfig } from '../constants/appConfig';

export interface ConfigRepository {
  getDepartments(): Promise<string[]>;
  addDepartment(name: string): Promise<string[]>;
  removeDepartment(name: string): Promise<string[]>;
  getShifts(): Promise<ShiftConfig[]>;
  addShift(shift: ShiftConfig): Promise<ShiftConfig[]>;
  removeShift(id: string): Promise<ShiftConfig[]>;
}

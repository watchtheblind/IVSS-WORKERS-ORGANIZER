import { ShiftConfig, RoomConfig } from '../constants/appConfig';

export interface HospitalSettings {
  hospitalName: string;
  showLogo: boolean;
  logoUri: string | null;
}

export const DEFAULT_HOSPITAL_SETTINGS: HospitalSettings = {
  hospitalName: '',
  showLogo: true,
  logoUri: null,
};

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
  getHospitalSettings(): Promise<HospitalSettings>;
  saveHospitalSettings(settings: HospitalSettings): Promise<void>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}
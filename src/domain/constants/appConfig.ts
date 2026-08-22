export interface ShiftConfig {
  id: string;
  label: string;
  icon: string;
}

export interface RoomStaffingPosition {
  position: string;
  count: number;
}

export interface RoomConfig {
  id: string;
  name: string;
  department: string;
  staffingMode: 'total' | 'by_position';
  staffCount: number;
  positions: RoomStaffingPosition[];
  status: 'available' | 'occupied' | 'maintenance';
  notes?: string;
}

export interface AppConfig {
  appName: string;
}

export const APP_CONFIG: AppConfig = {
  appName: 'FaciTurno',
};

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
  appBadge: string;
  defaultDepartments: string[];
  defaultShifts: ShiftConfig[];
  defaultRooms: RoomConfig[];
}

export const APP_CONFIG: AppConfig = {
  appName: 'FaciTurno',
  appBadge: 'PLANIFICACIÓN',
  defaultDepartments: [
    'Emergencia Adultos',
    'Emergencia Pediátrica',
    'Quirófano Central',
    'Hospitalización',
    'Laboratorio Clínico',
    'Mantenimiento / Servicios',
  ],
  defaultShifts: [
    { id: 'morning', label: 'Mañana (7am - 1pm)', icon: 'weather-sunny' },
    { id: 'afternoon', label: 'Tarde (1pm - 7pm)', icon: 'weather-sunset' },
    { id: 'night', label: 'Guardia Nocturna', icon: 'weather-night' },
    { id: '24h', label: 'Guardia 24 Horas', icon: 'clock-time-eight-outline' },
  ],
  defaultRooms: [
    {
      id: 'room_1',
      name: 'Sala de Trauma Shock',
      department: 'Emergencia Adultos',
      staffingMode: 'total',
      staffCount: 4,
      positions: [],
      status: 'available',
      notes: 'Equipada con monitores y desfibrilador',
    },
    {
      id: 'room_2',
      name: 'Sala de Observación A',
      department: 'Emergencia Adultos',
      staffingMode: 'total',
      staffCount: 8,
      positions: [],
      status: 'available',
      notes: 'Observación intermedia',
    },
    {
      id: 'room_3',
      name: 'Sala de Triaje Pediátrico',
      department: 'Emergencia Pediátrica',
      staffingMode: 'total',
      staffCount: 3,
      positions: [],
      status: 'available',
      notes: 'Evaluación inicial pediátrica',
    },
    {
      id: 'room_4',
      name: 'Pabellón Central 1',
      department: 'Quirófano Central',
      staffingMode: 'total',
      staffCount: 1,
      positions: [],
      status: 'available',
      notes: 'Cirugía general y laparoscopia',
    },
    {
      id: 'room_5',
      name: 'Sala de Recuperación',
      department: 'Quirófano Central',
      staffingMode: 'total',
      staffCount: 6,
      positions: [],
      status: 'available',
      notes: 'Monitoreo post-operatorio',
    },
    {
      id: 'room_6',
      name: 'Piso 2 - Medicina Interna',
      department: 'Hospitalización',
      staffingMode: 'total',
      staffCount: 12,
      positions: [],
      status: 'available',
      notes: 'Pacientes de estancia media',
    },
  ],
};

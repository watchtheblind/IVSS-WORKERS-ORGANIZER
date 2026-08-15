export interface ShiftConfig {
  id: string;
  label: string;
  icon: string;
}

export interface RoomConfig {
  id: string;
  name: string;
  department: string;
  capacity: number;
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
      capacity: 4,
      status: 'available',
      notes: 'Equipada con monitores y desfibrilador',
    },
    {
      id: 'room_2',
      name: 'Sala de Observación A',
      department: 'Emergencia Adultos',
      capacity: 8,
      status: 'available',
      notes: 'Camas de observación intermedia',
    },
    {
      id: 'room_3',
      name: 'Sala de Triaje Pediátrico',
      department: 'Emergencia Pediátrica',
      capacity: 3,
      status: 'available',
      notes: 'Evaluación inicial pediátrica',
    },
    {
      id: 'room_4',
      name: 'Pabellón Central 1',
      department: 'Quirófano Central',
      capacity: 1,
      status: 'available',
      notes: 'Cirugía general y laparoscopia',
    },
    {
      id: 'room_5',
      name: 'Sala de Recuperación',
      department: 'Quirófano Central',
      capacity: 6,
      status: 'available',
      notes: 'Monitoreo post-operatorio',
    },
    {
      id: 'room_6',
      name: 'Piso 2 - Medicina Interna',
      department: 'Hospitalización',
      capacity: 12,
      status: 'available',
      notes: 'Pacientes de estancia media',
    },
  ],
};

export interface ShiftConfig {
  id: string;
  label: string;
  icon: string;
}

export interface AppConfig {
  appName: string;
  appBadge: string;
  defaultDepartments: string[];
  defaultShifts: ShiftConfig[];
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
};

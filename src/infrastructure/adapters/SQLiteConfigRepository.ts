import { ConfigRepository, HospitalSettings, DEFAULT_HOSPITAL_SETTINGS } from '../../domain/ports/ConfigRepository';
import { ShiftConfig, RoomConfig, RoomStaffingPosition } from '../../domain/constants/appConfig';
import { getDatabase } from '../database';
import type { SQLiteDatabase } from 'expo-sqlite';

const SETTING_KEYS = {
  hospitalName: 'hospital_name',
  showLogo: 'hospital_show_logo',
  logoUri: 'hospital_logo_uri',
} as const;

function parsePositions(raw: string | null): RoomStaffingPosition[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapRoom(row: any): RoomConfig {
  return {
    id: row.id,
    name: row.name,
    department: row.department,
    staffingMode: row.staffing_mode || 'total',
    staffCount: row.staff_count || 0,
    positions: parsePositions(row.positions),
    status: row.status || 'available',
    notes: row.notes || '',
  };
}

export class SQLiteConfigRepository implements ConfigRepository {
  async getDatabase(): Promise<SQLiteDatabase> {
    return getDatabase();
  }

  async getDepartments(): Promise<string[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<{ name: string }>(
      'SELECT name FROM departments ORDER BY id ASC'
    );
    return rows.map((r) => r.name);
  }

  async addDepartment(name: string): Promise<string[]> {
    const db = await this.getDatabase();
    await db.runAsync('INSERT OR IGNORE INTO departments (name) VALUES (?)', [
      name.trim(),
    ]);
    return this.getDepartments();
  }

  async removeDepartment(name: string): Promise<string[]> {
    const db = await this.getDatabase();
    await db.runAsync('DELETE FROM rooms WHERE department = ?', [name]);
    await db.runAsync('DELETE FROM departments WHERE name = ?', [name]);
    return this.getDepartments();
  }

  async getShifts(): Promise<ShiftConfig[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<ShiftConfig>(
      'SELECT id, label, icon FROM shifts'
    );
    return rows;
  }

  async addShift(shift: ShiftConfig): Promise<ShiftConfig[]> {
    const db = await this.getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO shifts (id, label, icon) VALUES (?, ?, ?)',
      [shift.id, shift.label, shift.icon]
    );
    return this.getShifts();
  }

  async removeShift(id: string): Promise<ShiftConfig[]> {
    const db = await this.getDatabase();
    await db.runAsync('DELETE FROM shifts WHERE id = ?', [id]);
    return this.getShifts();
  }

  async getRooms(department?: string): Promise<RoomConfig[]> {
    const db = await this.getDatabase();
    let rows: any[];
    if (department && department !== 'Todas') {
      rows = await db.getAllAsync<any>(
        'SELECT * FROM rooms WHERE department = ? ORDER BY name ASC',
        [department]
      );
    } else {
      rows = await db.getAllAsync<any>(
        'SELECT * FROM rooms ORDER BY department ASC, name ASC'
      );
    }
    return rows.map(mapRoom);
  }

  async addRoom(room: RoomConfig): Promise<RoomConfig[]> {
    const db = await this.getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO rooms (id, name, department, staffing_mode, staff_count, positions, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        room.id,
        room.name,
        room.department,
        room.staffingMode,
        room.staffCount,
        JSON.stringify(room.positions || []),
        room.status,
        room.notes || '',
      ]
    );
    return this.getRooms();
  }

  async updateRoom(room: RoomConfig): Promise<RoomConfig[]> {
    const db = await this.getDatabase();
    await db.runAsync(
      'UPDATE rooms SET name = ?, department = ?, staffing_mode = ?, staff_count = ?, positions = ?, status = ?, notes = ? WHERE id = ?',
      [
        room.name,
        room.department,
        room.staffingMode,
        room.staffCount,
        JSON.stringify(room.positions || []),
        room.status,
        room.notes || '',
        room.id,
      ]
    );
    return this.getRooms();
  }

  async removeRoom(id: string): Promise<RoomConfig[]> {
    const db = await this.getDatabase();
    await db.runAsync('DELETE FROM rooms WHERE id = ?', [id]);
    return this.getRooms();
  }

  async getHospitalSettings(): Promise<HospitalSettings> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<{ key: string; value: string }>(
      'SELECT key, value FROM settings WHERE key IN (?, ?, ?)',
      [SETTING_KEYS.hospitalName, SETTING_KEYS.showLogo, SETTING_KEYS.logoUri]
    );
    const map: Record<string, string> = {};
    rows.forEach((r) => {
      map[r.key] = r.value;
    });
    return {
      hospitalName: map[SETTING_KEYS.hospitalName] ?? DEFAULT_HOSPITAL_SETTINGS.hospitalName,
      showLogo:
        map[SETTING_KEYS.showLogo] === undefined
          ? DEFAULT_HOSPITAL_SETTINGS.showLogo
          : map[SETTING_KEYS.showLogo] === '1',
      logoUri:
        map[SETTING_KEYS.logoUri] ?? DEFAULT_HOSPITAL_SETTINGS.logoUri,
    };
  }

  async saveHospitalSettings(settings: HospitalSettings): Promise<void> {
    const db = await this.getDatabase();
    const entries: [string, string][] = [
      [SETTING_KEYS.hospitalName, settings.hospitalName],
      [SETTING_KEYS.showLogo, settings.showLogo ? '1' : '0'],
      [SETTING_KEYS.logoUri, settings.logoUri ?? ''],
    ];
    for (const [key, value] of entries) {
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value]
      );
    }
  }

  async getSetting(key: string): Promise<string | null> {
    const db = await this.getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );
    return row ? row.value : null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  }
}
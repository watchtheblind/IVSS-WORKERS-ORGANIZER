import * as SQLite from 'expo-sqlite';
import { ConfigRepository } from '../../domain/ports/ConfigRepository';
import { APP_CONFIG, ShiftConfig, RoomConfig } from '../../domain/constants/appConfig';

export class SQLiteConfigRepository implements ConfigRepository {
  private db: SQLite.SQLiteDatabase | null = null;

  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync('workers.db');
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS departments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL
        );
        CREATE TABLE IF NOT EXISTS shifts (
          id TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          icon TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS rooms (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          department TEXT NOT NULL,
          capacity INTEGER DEFAULT 1,
          status TEXT DEFAULT 'available',
          notes TEXT DEFAULT ''
        );
      `);

      // Seed initial defaults if empty
      const existingDepts = await this.db.getAllAsync<{ id: number; name: string }>(
        'SELECT * FROM departments'
      );
      if (existingDepts.length === 0) {
        for (const dept of APP_CONFIG.defaultDepartments) {
          await this.db.runAsync(
            'INSERT OR IGNORE INTO departments (name) VALUES (?)',
            [dept]
          );
        }
      }

      const existingShifts = await this.db.getAllAsync<ShiftConfig>(
        'SELECT * FROM shifts'
      );
      if (existingShifts.length === 0) {
        for (const shift of APP_CONFIG.defaultShifts) {
          await this.db.runAsync(
            'INSERT OR IGNORE INTO shifts (id, label, icon) VALUES (?, ?, ?)',
            [shift.id, shift.label, shift.icon]
          );
        }
      }

      const existingRooms = await this.db.getAllAsync<RoomConfig>(
        'SELECT * FROM rooms'
      );
      if (existingRooms.length === 0) {
        for (const room of APP_CONFIG.defaultRooms) {
          await this.db.runAsync(
            'INSERT OR IGNORE INTO rooms (id, name, department, capacity, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [room.id, room.name, room.department, room.capacity, room.status, room.notes || '']
          );
        }
      }
    }
    return this.db;
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
    if (department && department !== 'Todas') {
      return db.getAllAsync<RoomConfig>(
        'SELECT * FROM rooms WHERE department = ? ORDER BY name ASC',
        [department]
      );
    }
    return db.getAllAsync<RoomConfig>('SELECT * FROM rooms ORDER BY department ASC, name ASC');
  }

  async addRoom(room: RoomConfig): Promise<RoomConfig[]> {
    const db = await this.getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO rooms (id, name, department, capacity, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [room.id, room.name, room.department, room.capacity, room.status, room.notes || '']
    );
    return this.getRooms();
  }

  async updateRoom(room: RoomConfig): Promise<RoomConfig[]> {
    const db = await this.getDatabase();
    await db.runAsync(
      'UPDATE rooms SET name = ?, department = ?, capacity = ?, status = ?, notes = ? WHERE id = ?',
      [room.name, room.department, room.capacity, room.status, room.notes || '', room.id]
    );
    return this.getRooms();
  }

  async removeRoom(id: string): Promise<RoomConfig[]> {
    const db = await this.getDatabase();
    await db.runAsync('DELETE FROM rooms WHERE id = ?', [id]);
    return this.getRooms();
  }
}

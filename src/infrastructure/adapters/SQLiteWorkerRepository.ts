import * as SQLite from 'expo-sqlite';
import { Worker, NewWorker } from '../../domain/entities/Worker';
import { WorkerRepository } from '../../domain/ports/WorkerRepository';

export class SQLiteWorkerRepository implements WorkerRepository {
  private db: SQLite.SQLiteDatabase | null = null;

  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync('workers.db');
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS workers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          supabase_id TEXT UNIQUE,
          full_name TEXT NOT NULL,
          position TEXT NOT NULL,
          synced INTEGER DEFAULT 0
        );
      `);
    }
    return this.db;
  }

  async addWorker(worker: NewWorker): Promise<Worker> {
    const db = await this.getDatabase();
    const result = await db.runAsync(
      'INSERT INTO workers (full_name, position, synced) VALUES (?, ?, 0)',
      [worker.full_name, worker.position]
    );
    return {
      id: result.lastInsertRowId,
      supabase_id: null,
      full_name: worker.full_name,
      position: worker.position,
      synced: 0,
    };
  }

  async getWorkers(): Promise<Worker[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<Worker>('SELECT * FROM workers ORDER BY id DESC');
    return rows;
  }

  async getUnsyncedWorkers(): Promise<Worker[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<Worker>('SELECT * FROM workers WHERE synced = 0');
    return rows;
  }

  async updateWorkerSyncStatus(id: number, supabaseId: string): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(
      'UPDATE workers SET synced = 1, supabase_id = ? WHERE id = ?',
      [supabaseId, id]
    );
  }

  async upsertWorkerBySupabaseId(
    worker: Omit<Worker, 'id' | 'synced'>
  ): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(
      `INSERT INTO workers (supabase_id, full_name, position, synced)
       VALUES (?, ?, ?, 1)
       ON CONFLICT(supabase_id) DO UPDATE SET
         full_name = excluded.full_name,
         position = excluded.position,
         synced = 1`,
      [worker.supabase_id, worker.full_name, worker.position]
    );
  }
}

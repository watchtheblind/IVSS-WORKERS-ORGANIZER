import * as SQLite from 'expo-sqlite';

const DB_NAME = 'workers.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrateRooms(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(rooms)');
  const names = columns.map((c) => c.name);

  if (!names.includes('staffing_mode')) {
    await db.execAsync("ALTER TABLE rooms ADD COLUMN staffing_mode TEXT DEFAULT 'total'");
  }
  if (!names.includes('staff_count')) {
    await db.execAsync('ALTER TABLE rooms ADD COLUMN staff_count INTEGER DEFAULT 1');
    await db.execAsync(
      'UPDATE rooms SET staff_count = capacity WHERE capacity IS NOT NULL AND capacity > 0'
    );
  }
  if (!names.includes('positions')) {
    await db.execAsync("ALTER TABLE rooms ADD COLUMN positions TEXT DEFAULT '[]'");
  }
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS workers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          supabase_id TEXT UNIQUE,
          full_name TEXT NOT NULL,
          position TEXT NOT NULL,
          synced INTEGER DEFAULT 0
        );
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
          staffing_mode TEXT DEFAULT 'total',
          staff_count INTEGER DEFAULT 1,
          positions TEXT DEFAULT '[]',
          status TEXT DEFAULT 'available',
          notes TEXT DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
      await migrateRooms(db);
      return db;
    })();
  }
  return dbPromise;
}
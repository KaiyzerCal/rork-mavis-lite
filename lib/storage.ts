import * as SQLite from 'expo-sqlite';

const DB_NAME = 'mavis_lite.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbReady = false;
let dbInitPromise: Promise<void> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance && dbReady) return dbInstance;

  if (dbInitPromise) {
    await dbInitPromise;
    return dbInstance!;
  }

  dbInitPromise = (async () => {
    try {
      console.log('[SQLiteStorage] Opening database...');
      dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
      await dbInstance.execAsync(
        `CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`
      );
      dbReady = true;
      console.log('[SQLiteStorage] Database ready');
    } catch (error) {
      console.error('[SQLiteStorage] Failed to initialize database:', error);
      dbInitPromise = null;
      throw error;
    }
  })();

  await dbInitPromise;
  return dbInstance!;
}

export const SQLiteStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const db = await getDb();
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM kv_store WHERE key = ?;',
        [key]
      );
      return row?.value ?? null;
    } catch (error) {
      console.error('[SQLiteStorage] getItem error:', error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const db = await getDb();
      await db.runAsync(
        'INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?);',
        [key, value]
      );
    } catch (error) {
      console.error('[SQLiteStorage] setItem error:', error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      const db = await getDb();
      await db.runAsync('DELETE FROM kv_store WHERE key = ?;', [key]);
    } catch (error) {
      console.error('[SQLiteStorage] removeItem error:', error);
    }
  },

  getAllKeys: async (): Promise<string[]> => {
    try {
      const db = await getDb();
      const rows = await db.getAllAsync<{ key: string }>('SELECT key FROM kv_store;');
      return rows.map((r) => r.key);
    } catch (error) {
      console.error('[SQLiteStorage] getAllKeys error:', error);
      return [];
    }
  },

  multiRemove: async (keys: string[]): Promise<void> => {
    if (keys.length === 0) return;
    try {
      const db = await getDb();
      const placeholders = keys.map(() => '?').join(',');
      await db.runAsync(`DELETE FROM kv_store WHERE key IN (${placeholders});`, keys);
    } catch (error) {
      console.error('[SQLiteStorage] multiRemove error:', error);
    }
  },
};

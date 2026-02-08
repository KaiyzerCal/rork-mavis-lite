import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface StorageInterface {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getAllKeys: () => Promise<string[]>;
  multiRemove: (keys: string[]) => Promise<void>;
}

let sqliteAvailable = false;
let SQLiteModule: any = null;

if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    SQLiteModule = require('expo-sqlite');
    sqliteAvailable = true;
    console.log('[Storage] expo-sqlite available');
  } catch {
    console.warn('[Storage] expo-sqlite not available, falling back to AsyncStorage');
  }
}

const DB_NAME = 'mavis_lite.db';
let dbInstance: any = null;
let dbReady = false;
let dbInitPromise: Promise<void> | null = null;

async function getDb(): Promise<any> {
  if (!sqliteAvailable || !SQLiteModule) {
    throw new Error('SQLite not available');
  }

  if (dbInstance && dbReady) return dbInstance;

  if (dbInitPromise) {
    await dbInitPromise;
    return dbInstance!;
  }

  dbInitPromise = (async () => {
    try {
      console.log('[SQLiteStorage] Opening database...');
      dbInstance = await SQLiteModule.openDatabaseAsync(DB_NAME);
      await dbInstance.execAsync(
        `CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`
      );
      dbReady = true;
      console.log('[SQLiteStorage] Database ready');
    } catch (error) {
      console.error('[SQLiteStorage] Failed to initialize database:', error);
      dbInitPromise = null;
      sqliteAvailable = false;
      throw error;
    }
  })();

  await dbInitPromise;
  return dbInstance!;
}

const sqliteStorage: StorageInterface = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const db = await getDb();
      const row = await db.getFirstAsync(
        'SELECT value FROM kv_store WHERE key = ?;',
        [key]
      ) as { value: string } | null;
      return row?.value ?? null;
    } catch (error) {
      console.error('[SQLiteStorage] getItem error, falling back:', error);
      return AsyncStorage.getItem(key);
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
      console.error('[SQLiteStorage] setItem error, falling back:', error);
      await AsyncStorage.setItem(key, value);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      const db = await getDb();
      await db.runAsync('DELETE FROM kv_store WHERE key = ?;', [key]);
    } catch (error) {
      console.error('[SQLiteStorage] removeItem error, falling back:', error);
      await AsyncStorage.removeItem(key);
    }
  },

  getAllKeys: async (): Promise<string[]> => {
    try {
      const db = await getDb();
      const rows = await db.getAllAsync('SELECT key FROM kv_store;') as { key: string }[];
      return rows.map((r: { key: string }) => r.key);
    } catch (error) {
      console.error('[SQLiteStorage] getAllKeys error, falling back:', error);
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    }
  },

  multiRemove: async (keys: string[]): Promise<void> => {
    if (keys.length === 0) return;
    try {
      const db = await getDb();
      const placeholders = keys.map(() => '?').join(',');
      await db.runAsync(`DELETE FROM kv_store WHERE key IN (${placeholders});`, keys);
    } catch (error) {
      console.error('[SQLiteStorage] multiRemove error, falling back:', error);
      await AsyncStorage.multiRemove(keys);
    }
  },
};

const asyncStorageWrapper: StorageInterface = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
  getAllKeys: async () => {
    const keys = await AsyncStorage.getAllKeys();
    return [...keys];
  },
  multiRemove: (keys) => AsyncStorage.multiRemove(keys),
};

export const SQLiteStorage: StorageInterface = sqliteAvailable ? sqliteStorage : asyncStorageWrapper;

import AsyncStorage from '@react-native-async-storage/async-storage';

interface StorageInterface {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getAllKeys: () => Promise<string[]>;
  multiRemove: (keys: string[]) => Promise<void>;
}

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

export const SQLiteStorage: StorageInterface = asyncStorageWrapper;

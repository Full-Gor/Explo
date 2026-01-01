import AsyncStorage from '@react-native-async-storage/async-storage';
import { FileItem, FolderStats, StorageInfo } from '../types';

const STORAGE_KEYS = {
  FILES: '@explo/files',
  RECENT_FILES: '@explo/recent_files',
  FAVORITES: '@explo/favorites',
  SETTINGS: '@explo/settings',
};

export const StorageService = {
  async getFiles(): Promise<FileItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FILES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting files:', error);
      return [];
    }
  },

  async saveFiles(files: FileItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    } catch (error) {
      console.error('Error saving files:', error);
    }
  },

  async getRecentFiles(): Promise<FileItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_FILES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting recent files:', error);
      return [];
    }
  },

  async addRecentFile(file: FileItem): Promise<void> {
    try {
      const recentFiles = await this.getRecentFiles();
      const filtered = recentFiles.filter((f) => f.id !== file.id);
      const updated = [{ ...file, isRecent: true }, ...filtered].slice(0, 20);
      await AsyncStorage.setItem(
        STORAGE_KEYS.RECENT_FILES,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Error adding recent file:', error);
    }
  },

  async getFavorites(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  },

  async toggleFavorite(fileId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const index = favorites.indexOf(fileId);
      let isFavorite: boolean;

      if (index > -1) {
        favorites.splice(index, 1);
        isFavorite = false;
      } else {
        favorites.push(fileId);
        isFavorite = true;
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.FAVORITES,
        JSON.stringify(favorites)
      );
      return isFavorite;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  },

  async getSettings(): Promise<Record<string, unknown>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  },

  async saveSetting(key: string, value: unknown): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings[key] = value;
      await AsyncStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  },

  // Mock storage info for demo
  getStorageInfo(): StorageInfo {
    const total = 100; // 100 GB
    const used = 40; // 40 GB used
    const free = total - used;
    const percentage = (used / total) * 100;

    return { used, total, free, percentage };
  },

  // Mock folder stats for demo
  getFolderStats(): FolderStats {
    return {
      totalFiles: 3248,
      totalFolders: 26,
      usedSpace: 40,
      freeSpace: 60,
    };
  },
};

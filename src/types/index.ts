export interface FileItem {
  id: string;
  name: string;
  extension: string;
  type: 'folder' | 'image' | 'audio' | 'document' | 'archive' | 'link' | 'app' | 'unknown';
  path?: string;
  size?: number;
  modifiedAt?: Date;
  createdAt?: Date;
  isRecent?: boolean;
  isMediaLibrary?: boolean;
  isMediaAsset?: boolean;
  isExternal?: boolean;
}

export interface FolderStats {
  totalFiles: number;
  totalFolders: number;
  usedSpace: number;
  freeSpace: number;
}

export interface CalendarDay {
  number: number;
  label?: string;
  isActive: boolean;
}

export type FileIconType =
  | 'folder'
  | 'image'
  | 'audio'
  | 'chart'
  | 'document'
  | 'archive'
  | 'dropbox'
  | 'color-wheel'
  | 'globe'
  | 'filetype'
  | 'app';

export interface StorageInfo {
  used: number;
  total: number;
  free: number;
  percentage: number;
}

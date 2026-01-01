import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';
import { FileItem } from '../types';

// Types de fichiers basés sur l'extension
const FILE_TYPE_MAP: Record<string, FileItem['type']> = {
  // Images
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.gif': 'image',
  '.webp': 'image',
  '.bmp': 'image',
  '.heic': 'image',
  '.heif': 'image',
  '.svg': 'image',
  // Video
  '.mp4': 'video',
  '.mov': 'video',
  '.avi': 'video',
  '.mkv': 'video',
  '.wmv': 'video',
  '.flv': 'video',
  '.webm': 'video',
  '.m4v': 'video',
  '.3gp': 'video',
  // Audio
  '.mp3': 'audio',
  '.wav': 'audio',
  '.m4a': 'audio',
  '.aac': 'audio',
  '.ogg': 'audio',
  '.flac': 'audio',
  '.wma': 'audio',
  // Documents
  '.pdf': 'document',
  '.doc': 'document',
  '.docx': 'document',
  '.xls': 'document',
  '.xlsx': 'document',
  '.ppt': 'document',
  '.pptx': 'document',
  '.txt': 'document',
  '.rtf': 'document',
  '.csv': 'document',
  '.json': 'document',
  '.xml': 'document',
  '.html': 'document',
  '.md': 'document',
  // Archives
  '.zip': 'archive',
  '.rar': 'archive',
  '.7z': 'archive',
  '.tar': 'archive',
  '.gz': 'archive',
  '.bz2': 'archive',
  // Apps
  '.apk': 'app',
  '.ipa': 'app',
  // Links
  '.url': 'link',
  '.webloc': 'link',
};

function getFileType(filename: string, isDirectory: boolean): FileItem['type'] {
  if (isDirectory) return 'folder';

  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
  return FILE_TYPE_MAP[ext] || 'unknown';
}

function getFileExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0] : '';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export interface StorageInfo {
  totalSpace: number;
  freeSpace: number;
  usedSpace: number;
  freeSpaceFormatted: string;
  totalSpaceFormatted: string;
  usedSpaceFormatted: string;
  usedPercentage: number;
}

export interface DirectoryInfo {
  files: FileItem[];
  totalFiles: number;
  totalFolders: number;
  path: string;
}

class FileSystemServiceClass {
  // Dossiers racine accessibles
  private readonly rootDirectories = {
    documents: FileSystem.documentDirectory,
    cache: FileSystem.cacheDirectory,
  };

  /**
   * Demande les permissions d'accès aux médias
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Vérifie si les permissions sont accordées
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Obtient les informations de stockage
   */
  async getStorageInfo(): Promise<StorageInfo> {
    try {
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      const totalSpace = await FileSystem.getTotalDiskCapacityAsync();
      const usedSpace = totalSpace - freeSpace;

      return {
        totalSpace,
        freeSpace,
        usedSpace,
        freeSpaceFormatted: formatFileSize(freeSpace),
        totalSpaceFormatted: formatFileSize(totalSpace),
        usedSpaceFormatted: formatFileSize(usedSpace),
        usedPercentage: Math.round((usedSpace / totalSpace) * 100),
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        totalSpace: 0,
        freeSpace: 0,
        usedSpace: 0,
        freeSpaceFormatted: '0 B',
        totalSpaceFormatted: '0 B',
        usedSpaceFormatted: '0 B',
        usedPercentage: 0,
      };
    }
  }

  /**
   * Obtient la liste des dossiers racine accessibles
   */
  async getRootDirectories(): Promise<FileItem[]> {
    const directories: FileItem[] = [];

    // Documents de l'app
    if (this.rootDirectories.documents) {
      const docCount = await this.countFilesInDirectory(this.rootDirectories.documents);
      directories.push({
        id: 'documents',
        name: 'Documents',
        extension: '',
        type: 'folder',
        path: this.rootDirectories.documents,
        itemCount: docCount,
      });
    }

    // Cache de l'app
    if (this.rootDirectories.cache) {
      const cacheCount = await this.countFilesInDirectory(this.rootDirectories.cache);
      directories.push({
        id: 'cache',
        name: 'Cache',
        extension: '',
        type: 'folder',
        path: this.rootDirectories.cache,
        itemCount: cacheCount,
      });
    }

    // Obtenir les albums média (photos, vidéos)
    try {
      const hasPermission = await this.checkPermissions();
      if (hasPermission) {
        // Compter les photos
        const photoCount = await this.countMediaAssets(MediaLibrary.MediaType.photo);
        directories.push({
          id: 'photos',
          name: 'Photos',
          extension: '',
          type: 'folder',
          path: 'media://photos',
          isMediaLibrary: true,
          itemCount: photoCount,
        });

        // Compter les vidéos
        const videoCount = await this.countMediaAssets(MediaLibrary.MediaType.video);
        directories.push({
          id: 'videos',
          name: 'Vidéos',
          extension: '',
          type: 'folder',
          path: 'media://videos',
          isMediaLibrary: true,
          itemCount: videoCount,
        });

        // Compter les audios
        const audioCount = await this.countMediaAssets(MediaLibrary.MediaType.audio);
        directories.push({
          id: 'audio',
          name: 'Audio',
          extension: '',
          type: 'folder',
          path: 'media://audio',
          isMediaLibrary: true,
          itemCount: audioCount,
        });

        // Documents - PDF, DOC, TXT, etc.
        directories.push({
          id: 'docs',
          name: 'Mes Documents',
          extension: '',
          type: 'folder',
          path: 'docs://all',
          isMediaLibrary: false,
          itemCount: 0, // Sera calculé dynamiquement
        });
      }
    } catch (error) {
      console.error('Error getting media permissions:', error);
    }

    // Téléchargements (si disponible) - utilise le dossier Documents de l'app pour stocker les téléchargements
    // Note: Sur Android, l'accès au dossier Downloads système nécessite des permissions spéciales
    const downloadPath = FileSystem.documentDirectory + 'Downloads/';
    try {
      // Créer le dossier Downloads s'il n'existe pas
      const downloadInfo = await FileSystem.getInfoAsync(downloadPath);
      if (!downloadInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadPath, { intermediates: true });
      }
      const dlCount = await this.countFilesInDirectory(downloadPath);
      directories.push({
        id: 'downloads',
        name: 'Téléchargements',
        extension: '',
        type: 'folder',
        path: downloadPath,
        itemCount: dlCount,
      });
    } catch (error) {
      console.log('Could not create Downloads folder:', error);
    }

    return directories;
  }

  /**
   * Compte les fichiers dans un dossier
   */
  async countFilesInDirectory(path: string): Promise<number> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(path);
      if (!dirInfo.exists) return 0;

      const contents = await FileSystem.readDirectoryAsync(path);
      return contents.filter(item => !item.startsWith('.')).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Compte les assets média d'un type donné
   */
  async countMediaAssets(mediaType: MediaLibrary.MediaTypeValue): Promise<number> {
    try {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType,
        first: 1, // On veut juste le total
      });
      return result.totalCount;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Liste le contenu d'un dossier
   */
  async listDirectory(path: string): Promise<DirectoryInfo> {
    const files: FileItem[] = [];
    let totalFiles = 0;
    let totalFolders = 0;

    try {
      // Si c'est un chemin media library
      if (path.startsWith('media://')) {
        return this.listMediaLibrary(path);
      }

      // Si c'est un chemin documents
      if (path.startsWith('docs://')) {
        return this.listDocumentFiles();
      }

      // Vérifier si le dossier existe
      const dirInfo = await FileSystem.getInfoAsync(path);
      if (!dirInfo.exists) {
        // Créer le dossier s'il n'existe pas (pour Documents)
        await FileSystem.makeDirectoryAsync(path, { intermediates: true });
      }

      const contents = await FileSystem.readDirectoryAsync(path);

      for (const item of contents) {
        // Ignorer les fichiers cachés
        if (item.startsWith('.')) continue;

        const itemPath = path.endsWith('/') ? `${path}${item}` : `${path}/${item}`;

        try {
          const info = await FileSystem.getInfoAsync(itemPath);
          const isDirectory = info.isDirectory || false;
          const extension = isDirectory ? '' : getFileExtension(item);
          const fileType = getFileType(item, isDirectory);

          if (isDirectory) {
            totalFolders++;
          } else {
            totalFiles++;
          }

          files.push({
            id: itemPath,
            name: isDirectory ? item : item.replace(/\.[^.]+$/, ''),
            extension,
            type: fileType,
            path: itemPath,
            size: (info as any).size || 0,
            modifiedAt: (info as any).modificationTime
              ? new Date((info as any).modificationTime * 1000)
              : undefined,
          });
        } catch (itemError) {
          console.warn(`Error getting info for ${item}:`, itemError);
        }
      }

      // Trier: dossiers d'abord, puis par nom
      files.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });

    } catch (error) {
      console.error('Error listing directory:', error);
    }

    return { files, totalFiles, totalFolders, path };
  }

  /**
   * Liste les médias de la bibliothèque
   */
  private async listMediaLibrary(path: string): Promise<DirectoryInfo> {
    const files: FileItem[] = [];
    let mediaType: MediaLibrary.MediaTypeValue;

    switch (path) {
      case 'media://photos':
        mediaType = MediaLibrary.MediaType.photo;
        break;
      case 'media://videos':
        mediaType = MediaLibrary.MediaType.video;
        break;
      case 'media://audio':
        mediaType = MediaLibrary.MediaType.audio;
        break;
      default:
        return { files: [], totalFiles: 0, totalFolders: 0, path };
    }

    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType,
        first: 100,
        sortBy: [MediaLibrary.SortBy.modificationTime],
      });

      for (const asset of media.assets) {
        const extension = getFileExtension(asset.filename);
        const fileType = mediaType === MediaLibrary.MediaType.video ? 'video' :
                         mediaType === MediaLibrary.MediaType.audio ? 'audio' : 'image';

        files.push({
          id: asset.id,
          name: asset.filename.replace(/\.[^.]+$/, ''),
          extension,
          type: fileType,
          path: asset.uri,
          size: asset.fileSize || 0,
          modifiedAt: new Date(asset.modificationTime * 1000),
          isMediaAsset: true,
          // Pour les images et vidéos, l'URI peut être utilisée comme miniature
          thumbnailUri: fileType !== 'audio' ? asset.uri : undefined,
        });
      }
    } catch (error) {
      console.error('Error listing media library:', error);
    }

    return {
      files,
      totalFiles: files.length,
      totalFolders: 0,
      path,
    };
  }

  /**
   * Liste tous les fichiers documents (PDF, DOC, TXT, etc.)
   */
  private async listDocumentFiles(): Promise<DirectoryInfo> {
    const files: FileItem[] = [];
    const documentExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.txt', '.rtf', '.csv', '.json', '.xml', '.html', '.md',
      '.odt', '.ods', '.odp'
    ];

    try {
      // Parcourir les dossiers accessibles pour trouver les documents
      const documentPaths = [
        FileSystem.documentDirectory,
        FileSystem.documentDirectory + 'Downloads/',
      ];

      for (const basePath of documentPaths) {
        if (!basePath) continue;

        try {
          const dirInfo = await FileSystem.getInfoAsync(basePath);
          if (!dirInfo.exists) continue;

          const contents = await FileSystem.readDirectoryAsync(basePath);

          for (const item of contents) {
            if (item.startsWith('.')) continue;

            const itemPath = basePath.endsWith('/') ? `${basePath}${item}` : `${basePath}/${item}`;
            const extension = getFileExtension(item).toLowerCase();

            // Vérifier si c'est un document
            if (documentExtensions.includes(extension)) {
              try {
                const info = await FileSystem.getInfoAsync(itemPath);

                files.push({
                  id: itemPath,
                  name: item.replace(/\.[^.]+$/, ''),
                  extension,
                  type: 'document',
                  path: itemPath,
                  size: (info as any).size || 0,
                  modifiedAt: (info as any).modificationTime
                    ? new Date((info as any).modificationTime * 1000)
                    : undefined,
                });
              } catch (itemError) {
                console.warn(`Error getting info for ${item}:`, itemError);
              }
            }
          }
        } catch (pathError) {
          console.warn(`Error reading path ${basePath}:`, pathError);
        }
      }

      // Trier par date de modification (plus récent en premier)
      files.sort((a, b) => {
        if (a.modifiedAt && b.modifiedAt) {
          return b.modifiedAt.getTime() - a.modifiedAt.getTime();
        }
        return a.name.localeCompare(b.name);
      });

    } catch (error) {
      console.error('Error listing document files:', error);
    }

    return {
      files,
      totalFiles: files.length,
      totalFolders: 0,
      path: 'docs://all',
    };
  }

  /**
   * Crée un nouveau dossier
   */
  async createFolder(parentPath: string, folderName: string): Promise<boolean> {
    try {
      // S'assurer que le chemin parent ne se termine pas déjà par un slash
      const cleanParentPath = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath;
      const newPath = `${cleanParentPath}/${folderName}`;

      // Vérifier si le dossier existe déjà
      const existingInfo = await FileSystem.getInfoAsync(newPath);
      if (existingInfo.exists) {
        console.log('Folder already exists:', newPath);
        return false;
      }

      await FileSystem.makeDirectoryAsync(newPath, { intermediates: true });

      // Vérifier que le dossier a bien été créé
      const newInfo = await FileSystem.getInfoAsync(newPath);
      return newInfo.exists;
    } catch (error) {
      console.error('Error creating folder:', error);
      return false;
    }
  }

  /**
   * Supprime un fichier ou dossier
   */
  async delete(path: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(path, { idempotent: true });
      return true;
    } catch (error) {
      console.error('Error deleting:', error);
      return false;
    }
  }

  /**
   * Renomme un fichier ou dossier
   */
  async rename(oldPath: string, newName: string): Promise<boolean> {
    try {
      const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
      const extension = getFileExtension(oldPath);
      const newPath = `${parentPath}/${newName}${extension}`;

      await FileSystem.moveAsync({
        from: oldPath,
        to: newPath,
      });
      return true;
    } catch (error) {
      console.error('Error renaming:', error);
      return false;
    }
  }

  /**
   * Renomme un asset MediaLibrary (copie avec nouveau nom puis supprime l'original)
   */
  async renameMediaAsset(assetId: string, assetUri: string, newName: string, extension: string): Promise<{ success: boolean; newPath?: string }> {
    try {
      // Obtenir l'URI locale de l'asset
      const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);
      const localUri = assetInfo?.localUri;

      if (!localUri) {
        console.error('Could not get local URI for asset');
        return { success: false };
      }

      // Créer le nouveau chemin dans le dossier Documents de l'app
      const newFileName = `${newName}${extension}`;
      const newPath = `${FileSystem.documentDirectory}renamed/${newFileName}`;

      // Créer le dossier renamed s'il n'existe pas
      const renamedDir = `${FileSystem.documentDirectory}renamed/`;
      const dirInfo = await FileSystem.getInfoAsync(renamedDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(renamedDir, { intermediates: true });
      }

      // Vérifier si un fichier avec ce nom existe déjà
      const existingInfo = await FileSystem.getInfoAsync(newPath);
      if (existingInfo.exists) {
        console.error('A file with this name already exists');
        return { success: false };
      }

      // Copier le fichier avec le nouveau nom
      await FileSystem.copyAsync({
        from: localUri,
        to: newPath,
      });

      // Vérifier que la copie a réussi
      const newFileInfo = await FileSystem.getInfoAsync(newPath);
      if (!newFileInfo.exists) {
        console.error('Failed to copy file');
        return { success: false };
      }

      // Supprimer l'original de MediaLibrary
      try {
        await MediaLibrary.deleteAssetsAsync([assetId]);
      } catch (deleteError) {
        console.warn('Could not delete original asset:', deleteError);
        // On continue quand même car le fichier renommé existe
      }

      return { success: true, newPath };
    } catch (error) {
      console.error('Error renaming media asset:', error);
      return { success: false };
    }
  }

  /**
   * Copie un fichier
   */
  async copy(sourcePath: string, destinationPath: string): Promise<boolean> {
    try {
      await FileSystem.copyAsync({
        from: sourcePath,
        to: destinationPath,
      });
      return true;
    } catch (error) {
      console.error('Error copying:', error);
      return false;
    }
  }

  /**
   * Déplace un fichier
   */
  async move(sourcePath: string, destinationPath: string): Promise<boolean> {
    try {
      await FileSystem.moveAsync({
        from: sourcePath,
        to: destinationPath,
      });
      return true;
    } catch (error) {
      console.error('Error moving:', error);
      return false;
    }
  }

  /**
   * Partage un fichier
   */
  async share(path: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        console.warn('Sharing is not available on this platform');
        return false;
      }
      await Sharing.shareAsync(path);
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  }

  /**
   * Ouvre un fichier avec l'application par défaut
   */
  async openFile(path: string, mimeType?: string, isMediaAsset?: boolean): Promise<boolean> {
    try {
      let fileUri = path;

      // Pour les assets média, obtenir l'URI locale
      if (isMediaAsset || path.startsWith('ph://') || path.startsWith('assets-library://')) {
        const assetInfo = await this.getMediaAssetLocalUri(path);
        if (assetInfo) {
          fileUri = assetInfo;
        } else {
          // Fallback: utiliser le partage
          return await this.share(path);
        }
      }

      if (Platform.OS === 'android') {
        // Vérifier si le fichier existe dans le système de fichiers normal
        if (fileUri.startsWith('file://') || fileUri.startsWith('/')) {
          const contentUri = await FileSystem.getContentUriAsync(fileUri);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: mimeType || '*/*',
          });
        } else {
          // Pour les URIs spéciales, essayer directement
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: fileUri,
            flags: 1,
            type: mimeType || '*/*',
          });
        }
        return true;
      } else {
        // Sur iOS, utiliser le partage pour ouvrir
        await Sharing.shareAsync(fileUri);
        return true;
      }
    } catch (error) {
      console.error('Error opening file:', error);
      // Fallback: essayer le partage
      try {
        await Sharing.shareAsync(path);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Obtient l'URI locale d'un asset média
   */
  private async getMediaAssetLocalUri(assetUri: string): Promise<string | null> {
    try {
      // Extraire l'ID de l'asset
      let assetId = assetUri;
      if (assetUri.startsWith('ph://')) {
        assetId = assetUri.replace('ph://', '').split('/')[0];
      }

      const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);
      return assetInfo?.localUri || null;
    } catch (error) {
      console.error('Error getting media asset local URI:', error);
      return null;
    }
  }

  /**
   * Obtient les fichiers récents (images, vidéos, audio)
   */
  async getRecentFiles(limit: number = 50): Promise<FileItem[]> {
    const files: FileItem[] = [];

    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return files;
      }

      // Récupérer les médias récents (photos, vidéos, audio)
      const media = await MediaLibrary.getAssetsAsync({
        first: limit,
        sortBy: [[MediaLibrary.SortBy.modificationTime, false]], // Du plus récent au plus ancien
      });

      for (const asset of media.assets) {
        const extension = getFileExtension(asset.filename);
        let fileType: FileItem['type'] = 'unknown';

        if (asset.mediaType === MediaLibrary.MediaType.photo) {
          fileType = 'image';
        } else if (asset.mediaType === MediaLibrary.MediaType.video) {
          fileType = 'video';
        } else if (asset.mediaType === MediaLibrary.MediaType.audio) {
          fileType = 'audio';
        }

        files.push({
          id: asset.id,
          name: asset.filename.replace(/\.[^.]+$/, ''),
          extension,
          type: fileType,
          path: asset.uri,
          size: asset.fileSize || 0,
          modifiedAt: new Date(asset.modificationTime * 1000),
          createdAt: new Date(asset.creationTime * 1000),
          isMediaAsset: true,
          isRecent: true,
          thumbnailUri: fileType !== 'audio' ? asset.uri : undefined,
        });
      }
    } catch (error) {
      console.error('Error getting recent files:', error);
    }

    return files;
  }

  /**
   * Obtient les informations d'un fichier
   */
  async getFileInfo(path: string): Promise<FileItem | null> {
    try {
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) return null;

      const filename = path.split('/').pop() || '';
      const isDirectory = info.isDirectory || false;
      const extension = isDirectory ? '' : getFileExtension(filename);

      return {
        id: path,
        name: isDirectory ? filename : filename.replace(/\.[^.]+$/, ''),
        extension,
        type: getFileType(filename, isDirectory),
        path,
        size: (info as any).size || 0,
        modifiedAt: (info as any).modificationTime
          ? new Date((info as any).modificationTime * 1000)
          : undefined,
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }
}

export const FileSystemService = new FileSystemServiceClass();

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Vibration,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SearchBar, ProgressBar, FileItem } from '../components';
import {
  FolderIcon,
  ImageIcon,
  VideoIcon,
  AudioIcon,
  DocumentIcon,
  ArchiveIcon,
  AppIcon,
  MenuIcon,
} from '../components/FileIcons';
import { colors, gradients, borderRadius, neuShadow } from '../theme/colors';
import { FileSystemService, StorageInfo } from '../services/fileSystem';
import { FileItem as FileItemType } from '../types';

const FOLDER_COLORS_STORAGE_KEY = 'folder_colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Folder: { folderId: string; folderName: string; path: string };
  FileDetail: { file: FileItemType };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function getFileIcon(type: FileItemType['type'], size = 40, folderColor?: string) {
  switch (type) {
    case 'folder':
      return <FolderIcon size={size} color={folderColor} />;
    case 'image':
      return <ImageIcon size={size} />;
    case 'video':
      return <VideoIcon size={size} />;
    case 'audio':
      return <AudioIcon size={size} />;
    case 'archive':
      return <ArchiveIcon size={size} />;
    case 'app':
      return <AppIcon size={size} />;
    case 'document':
    default:
      return <DocumentIcon size={size} />;
  }
}

export function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [files, setFiles] = useState<FileItemType[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalFolders, setTotalFolders] = useState(0);
  const [folderColors, setFolderColors] = useState<Record<string, string>>({});

  // Charger les couleurs des dossiers
  const loadFolderColors = async () => {
    try {
      const stored = await AsyncStorage.getItem(FOLDER_COLORS_STORAGE_KEY);
      if (stored) {
        setFolderColors(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading folder colors:', error);
    }
  };

  // Charger les données au démarrage
  useEffect(() => {
    initializeApp();
    loadFolderColors();
  }, []);

  // Recharger quand l'écran revient au focus
  useFocusEffect(
    useCallback(() => {
      if (hasPermission) {
        loadFiles();
      }
      loadFolderColors();
    }, [hasPermission])
  );

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      // Demander les permissions
      const granted = await FileSystemService.requestPermissions();
      setHasPermission(granted);

      if (!granted) {
        Alert.alert(
          'Permissions requises',
          'Cette application a besoin d\'accéder à vos fichiers pour fonctionner.',
          [
            { text: 'Réessayer', onPress: initializeApp },
            { text: 'Annuler', style: 'cancel' },
          ]
        );
      }

      // Charger les données
      await Promise.all([loadFiles(), loadStorageInfo()]);
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const rootDirs = await FileSystemService.getRootDirectories();
      setFiles(rootDirs);
      setTotalFolders(rootDirs.filter(f => f.type === 'folder').length);
      setTotalFiles(rootDirs.filter(f => f.type !== 'folder').length);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const info = await FileSystemService.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadFiles(), loadStorageInfo()]);
    setIsRefreshing(false);
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleVoiceSearch = useCallback(() => {
    Vibration.vibrate(50);
    // TODO: Implémenter la recherche vocale
  }, []);

  const handleFilePress = useCallback((file: FileItemType) => {
    Vibration.vibrate(10);
    if (file.type === 'folder' && file.path) {
      navigation.navigate('Folder', {
        folderId: file.id,
        folderName: file.name,
        path: file.path,
      });
    } else if (file.path) {
      navigation.navigate('FileDetail', { file });
    }
  }, [navigation]);

  const handleFileLongPress = useCallback((file: FileItemType) => {
    Vibration.vibrate(50);
    Alert.alert(
      file.name,
      'Que voulez-vous faire ?',
      [
        { text: 'Ouvrir', onPress: () => handleFilePress(file) },
        {
          text: 'Partager',
          onPress: async () => {
            if (file.path) {
              await FileSystemService.share(file.path);
            }
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  }, [handleFilePress]);

  const toggleMenu = useCallback(() => {
    Vibration.vibrate(10);
    Alert.alert(
      'Menu',
      'Options',
      [
        { text: 'Actualiser', onPress: handleRefresh },
        { text: 'Paramètres', onPress: () => {} },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentGradientStart} />
          <Text style={styles.loadingText}>Chargement des fichiers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec gradient sombre */}
      <LinearGradient
        colors={gradients.darkCard as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        {/* Bouton Menu */}
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <MenuIcon size={24} />
        </TouchableOpacity>

        {/* Barre de recherche */}
        <SearchBar
          onSearch={handleSearch}
          onVoiceSearch={handleVoiceSearch}
          placeholder={t('common.search')}
        />

        {/* Info stockage */}
        <View style={styles.storageInfo}>
          <LinearGradient
            colors={gradients.accent as [string, string]}
            style={styles.storageIcon}
          >
            <Feather name="hard-drive" size={24} color={colors.white} />
          </LinearGradient>
          <View style={styles.storageText}>
            <Text style={styles.storageTitle}>{t('files.myDocs')}</Text>
            <Text style={styles.storageSubtitle}>
              {totalFiles} fichiers, {totalFolders} dossiers
            </Text>
          </View>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={storageInfo?.usedPercentage || 0}
            label={`${storageInfo?.freeSpaceFormatted || '...'} disponible`}
          />
        </View>
      </LinearGradient>

      {/* Grille des fichiers */}
      <View style={styles.filesContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.filesScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accentGradientStart}
            />
          }
        >
          <View style={styles.filesGrid}>
            {filteredFiles.map((file) => (
              <View key={file.id} style={styles.fileGridItem}>
                <FileItem
                  name={file.name}
                  extension={file.extension}
                  icon={getFileIcon(file.type, 40, file.path ? folderColors[file.path] : undefined)}
                  thumbnailUri={file.thumbnailUri}
                  itemCount={file.type === 'folder' ? file.itemCount : undefined}
                  onPress={() => handleFilePress(file)}
                  onLongPress={() => handleFileLongPress(file)}
                  variant="solid"
                />
              </View>
            ))}
          </View>

          {filteredFiles.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Feather name="folder" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aucun fichier trouvé' : 'Aucun dossier accessible'}
              </Text>
              {!hasPermission && (
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={initializeApp}
                >
                  <Text style={styles.permissionButtonText}>
                    Autoriser l'accès aux fichiers
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: colors.textMuted,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  menuButton: {
    alignSelf: 'center',
    marginBottom: 16,
    padding: 8,
  },
  storageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  storageIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...neuShadow.raised,
  },
  storageText: {
    flex: 1,
  },
  storageTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  storageSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
  progressContainer: {
    marginTop: 8,
  },
  filesContainer: {
    flex: 1,
    backgroundColor: colors.cardLight,
    marginTop: -20,
    paddingTop: 30,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  filesScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  filesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fileGridItem: {
    width: SCREEN_WIDTH / 3 - 16,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.accentGradientStart,
    borderRadius: borderRadius.md,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

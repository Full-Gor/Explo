import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Vibration,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SearchBar, ProgressBar, FileItem } from '../components';
import {
  FolderIcon,
  ImageIcon,
  AudioIcon,
  ChartIcon,
  DocumentIcon,
  ArchiveIcon,
  MenuIcon,
} from '../components/FileIcons';
import { colors, gradients, borderRadius, neuShadow } from '../theme/colors';
import { StorageService } from '../services/storage';
import { FileItem as FileItemType } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Folder: { folderId: string; folderName: string };
  FileDetail: { file: FileItemType };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Données de démonstration des fichiers
const DEMO_FILES: FileItemType[] = [
  { id: '1', name: 'Documents', extension: '', type: 'folder' },
  { id: '2', name: 'Images', extension: '', type: 'folder' },
  { id: '3', name: 'Musique', extension: '', type: 'folder' },
  { id: '4', name: 'Téléchargements', extension: '', type: 'folder' },
  { id: '5', name: 'Vidéos', extension: '', type: 'folder' },
  { id: '6', name: 'Archives', extension: '', type: 'folder' },
  { id: '7', name: 'Vacances', extension: '.jpeg', type: 'image' },
  { id: '8', name: 'Podcast', extension: '.mp3', type: 'audio' },
  { id: '9', name: 'Budget', extension: '.xlsx', type: 'document' },
  { id: '10', name: 'Rapport', extension: '.docx', type: 'document' },
  { id: '11', name: 'Backup', extension: '.zip', type: 'archive' },
  { id: '12', name: 'Notes', extension: '.txt', type: 'document' },
];

function getFileIcon(type: FileItemType['type'], size = 40) {
  switch (type) {
    case 'folder':
      return <FolderIcon size={size} />;
    case 'image':
      return <ImageIcon size={size} />;
    case 'audio':
      return <AudioIcon size={size} />;
    case 'archive':
      return <ArchiveIcon size={size} />;
    case 'document':
    default:
      return <DocumentIcon size={size} />;
  }
}

export function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const folderStats = StorageService.getFolderStats();
  const storageInfo = StorageService.getStorageInfo();

  const filteredFiles = DEMO_FILES.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleVoiceSearch = useCallback(() => {
    Vibration.vibrate(50);
  }, []);

  const handleFilePress = useCallback((file: FileItemType) => {
    Vibration.vibrate(10);
    if (file.type === 'folder') {
      navigation.navigate('Folder', { folderId: file.id, folderName: file.name });
    } else {
      navigation.navigate('FileDetail', { file });
    }
  }, [navigation]);

  const handleFileLongPress = useCallback((file: FileItemType) => {
    Vibration.vibrate(50);
    // TODO: Afficher menu contextuel (copier, déplacer, supprimer, etc.)
  }, []);

  const toggleMenu = useCallback(() => {
    Vibration.vibrate(10);
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen]);

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
            <Feather name="folder" size={24} color={colors.white} />
          </LinearGradient>
          <View style={styles.storageText}>
            <Text style={styles.storageTitle}>{t('files.myDocs')}</Text>
            <Text style={styles.storageSubtitle}>
              {t('files.filesAndFolders', {
                files: folderStats.totalFiles,
                folders: folderStats.totalFolders,
              })}
            </Text>
          </View>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={storageInfo.percentage}
            label={t('files.freeSpace', { space: `${storageInfo.free} GB` })}
          />
        </View>
      </LinearGradient>

      {/* Grille des fichiers */}
      <View style={styles.filesContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.filesScrollContent}
        >
          <View style={styles.filesGrid}>
            {filteredFiles.map((file) => (
              <View key={file.id} style={styles.fileGridItem}>
                <FileItem
                  name={file.name}
                  extension={file.extension}
                  icon={getFileIcon(file.type)}
                  onPress={() => handleFilePress(file)}
                  onLongPress={() => handleFileLongPress(file)}
                  variant="solid"
                />
              </View>
            ))}
          </View>

          {filteredFiles.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="search" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aucun fichier trouvé</Text>
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
    paddingBottom: 100,
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
  },
});

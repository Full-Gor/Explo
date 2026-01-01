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
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SearchBar, FileItem } from '../components';
import {
  FolderIcon,
  ImageIcon,
  AudioIcon,
  DocumentIcon,
  ArchiveIcon,
} from '../components/FileIcons';
import { colors, borderRadius, neuShadow } from '../theme/colors';
import { FileItem as FileItemType } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Folder: { folderId: string; folderName: string };
  FileDetail: { file: FileItemType };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FolderRouteProp = RouteProp<RootStackParamList, 'Folder'>;

// Données de démonstration par dossier
const FOLDER_CONTENTS: Record<string, FileItemType[]> = {
  '1': [ // Documents
    { id: '1-1', name: 'Travail', extension: '', type: 'folder' },
    { id: '1-2', name: 'Personnel', extension: '', type: 'folder' },
    { id: '1-3', name: 'CV', extension: '.pdf', type: 'document' },
    { id: '1-4', name: 'Contrat', extension: '.docx', type: 'document' },
    { id: '1-5', name: 'Factures', extension: '.xlsx', type: 'document' },
  ],
  '2': [ // Images
    { id: '2-1', name: 'Vacances 2024', extension: '', type: 'folder' },
    { id: '2-2', name: 'Screenshots', extension: '', type: 'folder' },
    { id: '2-3', name: 'Photo1', extension: '.jpg', type: 'image' },
    { id: '2-4', name: 'Photo2', extension: '.png', type: 'image' },
    { id: '2-5', name: 'Panorama', extension: '.jpeg', type: 'image' },
    { id: '2-6', name: 'Portrait', extension: '.heic', type: 'image' },
  ],
  '3': [ // Musique
    { id: '3-1', name: 'Playlists', extension: '', type: 'folder' },
    { id: '3-2', name: 'Podcasts', extension: '', type: 'folder' },
    { id: '3-3', name: 'Song1', extension: '.mp3', type: 'audio' },
    { id: '3-4', name: 'Song2', extension: '.m4a', type: 'audio' },
    { id: '3-5', name: 'Album', extension: '.flac', type: 'audio' },
  ],
  '4': [ // Téléchargements
    { id: '4-1', name: 'App', extension: '.apk', type: 'archive' },
    { id: '4-2', name: 'Setup', extension: '.exe', type: 'archive' },
    { id: '4-3', name: 'Guide', extension: '.pdf', type: 'document' },
    { id: '4-4', name: 'Image', extension: '.png', type: 'image' },
  ],
  '5': [ // Vidéos
    { id: '5-1', name: 'Films', extension: '', type: 'folder' },
    { id: '5-2', name: 'Clips', extension: '', type: 'folder' },
    { id: '5-3', name: 'Video1', extension: '.mp4', type: 'document' },
    { id: '5-4', name: 'Video2', extension: '.mov', type: 'document' },
  ],
  '6': [ // Archives
    { id: '6-1', name: 'Backup_2024', extension: '.zip', type: 'archive' },
    { id: '6-2', name: 'Photos_old', extension: '.tar.gz', type: 'archive' },
    { id: '6-3', name: 'Projects', extension: '.rar', type: 'archive' },
  ],
};

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

export function FolderScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FolderRouteProp>();
  const { folderId, folderName } = route.params;

  const [searchQuery, setSearchQuery] = useState('');

  const folderContents = FOLDER_CONTENTS[folderId] || [];
  const filteredFiles = folderContents.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleBack = useCallback(() => {
    Vibration.vibrate(10);
    navigation.goBack();
  }, [navigation]);

  const handleFilePress = useCallback((file: FileItemType) => {
    Vibration.vibrate(10);
    if (file.type === 'folder') {
      navigation.push('Folder', { folderId: file.id, folderName: file.name });
    } else {
      navigation.navigate('FileDetail', { file });
    }
  }, [navigation]);

  const handleFileLongPress = useCallback((file: FileItemType) => {
    Vibration.vibrate(50);
    // TODO: Menu contextuel
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {folderName}
        </Text>
        <TouchableOpacity style={styles.moreButton}>
          <Feather name="more-vertical" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <SearchBar onSearch={handleSearch} placeholder="Rechercher..." />
      </View>

      {/* Info du dossier */}
      <View style={styles.folderInfo}>
        <FolderIcon size={32} />
        <Text style={styles.folderInfoText}>
          {filteredFiles.length} éléments
        </Text>
      </View>

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
              <Feather name="folder" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Dossier vide</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.cardBg,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
  moreButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cardBg,
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBgAlt,
  },
  folderInfoText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  filesContainer: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  filesScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
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

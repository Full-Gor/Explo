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
  TextInput,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SearchBar, FileItem } from '../components';
import {
  FolderIcon,
  ImageIcon,
  VideoIcon,
  AudioIcon,
  DocumentIcon,
  ArchiveIcon,
  AppIcon,
} from '../components/FileIcons';
import { colors, borderRadius } from '../theme/colors';
import { FileSystemService } from '../services/fileSystem';
import { FileItem as FileItemType } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Folder: { folderId: string; folderName: string; path: string };
  FileDetail: { file: FileItemType };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FolderRouteProp = RouteProp<RootStackParamList, 'Folder'>;

function getFileIcon(type: FileItemType['type'], size = 40) {
  switch (type) {
    case 'folder':
      return <FolderIcon size={size} />;
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

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FolderScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FolderRouteProp>();
  const { folderName, path } = route.params;

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [files, setFiles] = useState<FileItemType[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalFolders, setTotalFolders] = useState(0);

  // Modal pour créer un dossier
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadDirectory();
  }, [path]);

  const loadDirectory = async () => {
    setIsLoading(true);
    try {
      const result = await FileSystemService.listDirectory(path);
      setFiles(result.files);
      setTotalFiles(result.totalFiles);
      setTotalFolders(result.totalFolders);
    } catch (error) {
      console.error('Error loading directory:', error);
      Alert.alert('Erreur', 'Impossible de charger ce dossier');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDirectory();
    setIsRefreshing(false);
  };

  const filteredFiles = files.filter((file) =>
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
    if (file.type === 'folder' && file.path) {
      navigation.push('Folder', {
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
      file.name + file.extension,
      file.size ? `Taille: ${formatFileSize(file.size)}` : 'Que voulez-vous faire ?',
      [
        { text: 'Ouvrir', onPress: () => handleFilePress(file) },
        {
          text: 'Partager',
          onPress: async () => {
            if (file.path && !file.isMediaLibrary) {
              const success = await FileSystemService.share(file.path);
              if (!success) {
                Alert.alert('Erreur', 'Impossible de partager ce fichier');
              }
            }
          },
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => confirmDelete(file),
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  }, [handleFilePress]);

  const confirmDelete = (file: FileItemType) => {
    Alert.alert(
      'Confirmer la suppression',
      `Voulez-vous vraiment supprimer "${file.name}${file.extension}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (file.path) {
              const success = await FileSystemService.delete(file.path);
              if (success) {
                await loadDirectory();
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer ce fichier');
              }
            }
          },
        },
      ]
    );
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de dossier');
      return;
    }

    const success = await FileSystemService.createFolder(path, newFolderName.trim());
    if (success) {
      setShowNewFolderModal(false);
      setNewFolderName('');
      await loadDirectory();
    } else {
      Alert.alert('Erreur', 'Impossible de créer le dossier');
    }
  };

  const handleMoreOptions = () => {
    Vibration.vibrate(10);
    Alert.alert(
      'Options',
      folderName,
      [
        { text: 'Nouveau dossier', onPress: () => setShowNewFolderModal(true) },
        { text: 'Actualiser', onPress: handleRefresh },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {folderName}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentGradientStart} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <TouchableOpacity onPress={handleMoreOptions} style={styles.moreButton}>
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
          {totalFolders} dossiers, {totalFiles} fichiers
        </Text>
        <TouchableOpacity
          onPress={() => setShowNewFolderModal(true)}
          style={styles.addButton}
        >
          <Feather name="folder-plus" size={20} color={colors.accentGradientStart} />
        </TouchableOpacity>
      </View>

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
                  icon={getFileIcon(file.type)}
                  thumbnailUri={file.thumbnailUri}
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
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aucun résultat' : 'Dossier vide'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.createFolderButton}
                  onPress={() => setShowNewFolderModal(true)}
                >
                  <Feather name="folder-plus" size={20} color={colors.white} />
                  <Text style={styles.createFolderText}>Créer un dossier</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Modal Nouveau Dossier */}
      <Modal
        visible={showNewFolderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewFolderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouveau dossier</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nom du dossier"
              placeholderTextColor={colors.textMuted}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleCreateFolder}
              >
                <Text style={styles.modalButtonConfirmText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
  },
  addButton: {
    padding: 8,
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
  createFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.accentGradientStart,
    borderRadius: borderRadius.md,
  },
  createFolderText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH - 60,
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.lg,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textDark,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: borderRadius.sm,
  },
  modalButtonCancelText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.accentGradientStart,
    borderRadius: borderRadius.sm,
  },
  modalButtonConfirmText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

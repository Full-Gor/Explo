import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import { FileSystemService, sortFiles, SortOption, SortOrder } from '../services/fileSystem';
import { FileItem as FileItemType } from '../types';

// Options de tri
const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'name', label: 'Nom', icon: 'type' },
  { value: 'date', label: 'Date', icon: 'calendar' },
  { value: 'size', label: 'Taille', icon: 'hard-drive' },
  { value: 'type', label: 'Type', icon: 'file' },
];

// Couleurs disponibles pour les dossiers
const FOLDER_COLORS = [
  colors.folderOrange,
  '#FF6B6B', // Rouge
  '#4ECDC4', // Turquoise
  '#45B7D1', // Bleu clair
  '#96CEB4', // Vert menthe
  '#9B59B6', // Violet
  '#3498DB', // Bleu
  '#E74C3C', // Rouge vif
  '#2ECC71', // Vert
  '#F39C12', // Orange
  '#1ABC9C', // Teal
  '#E91E63', // Pink
];

const FOLDER_COLORS_STORAGE_KEY = 'folder_colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Folder: { folderId: string; folderName: string; path: string };
  FileDetail: { file: FileItemType };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FolderRouteProp = RouteProp<RootStackParamList, 'Folder'>;

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
  const [showSortModal, setShowSortModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [folderColors, setFolderColors] = useState<Record<string, string>>({});

  // Options de tri
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Charger les couleurs des dossiers
  useEffect(() => {
    loadFolderColors();
  }, []);

  useEffect(() => {
    loadDirectory();
  }, [path]);

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

  const saveFolderColor = async (folderPath: string, color: string) => {
    try {
      const newColors = { ...folderColors, [folderPath]: color };
      await AsyncStorage.setItem(FOLDER_COLORS_STORAGE_KEY, JSON.stringify(newColors));
      setFolderColors(newColors);
    } catch (error) {
      console.error('Error saving folder color:', error);
    }
  };

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

  // Filtrer et trier les fichiers
  const filteredAndSortedFiles = React.useMemo(() => {
    const filtered = files.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return sortFiles(filtered, sortBy, sortOrder);
  }, [files, searchQuery, sortBy, sortOrder]);

  // Changer le tri
  const handleSortChange = (option: SortOption) => {
    if (sortBy === option) {
      // Inverser l'ordre si on clique sur la même option
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder('asc');
    }
    setShowSortModal(false);
  };

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

  // Vérifie si le chemin permet la création de dossiers
  const isMediaLibraryPath = path.startsWith('media://');
  const isVirtualPath = path.startsWith('docs://');
  const canCreateFolder = !isMediaLibraryPath && !isVirtualPath;

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de dossier');
      return;
    }

    if (isMediaLibraryPath || isVirtualPath) {
      Alert.alert('Non supporté', 'Impossible de créer un dossier ici. Allez dans Documents ou Téléchargements.');
      setShowNewFolderModal(false);
      return;
    }

    try {
      const result = await FileSystemService.createFolder(path, newFolderName.trim());
      if (result.success && result.path) {
        // Sauvegarder la couleur du dossier
        await saveFolderColor(result.path, selectedColor);

        setShowNewFolderModal(false);
        setNewFolderName('');
        setSelectedColor(FOLDER_COLORS[0]);
        await loadDirectory();
        Alert.alert('Succès', 'Dossier créé avec succès');
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de créer le dossier');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création du dossier');
    }
  };

  const handleMoreOptions = () => {
    Vibration.vibrate(10);

    const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [];

    if (canCreateFolder) {
      options.push({ text: 'Nouveau dossier', onPress: () => setShowNewFolderModal(true) });
    }
    options.push({ text: 'Trier par...', onPress: () => setShowSortModal(true) });
    options.push({ text: 'Actualiser', onPress: handleRefresh });
    options.push({ text: 'Annuler', style: 'cancel' });

    Alert.alert('Options', folderName, options);
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

      {/* Info du dossier et options de tri */}
      <View style={styles.folderInfo}>
        <FolderIcon size={32} />
        <Text style={styles.folderInfoText}>
          {totalFolders} dossiers, {totalFiles} fichiers
        </Text>
        <TouchableOpacity
          onPress={() => setShowSortModal(true)}
          style={styles.sortButton}
        >
          <Feather
            name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
            size={16}
            color={colors.accentGradientStart}
          />
          <Text style={styles.sortButtonText}>
            {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
          </Text>
        </TouchableOpacity>
        {canCreateFolder && (
          <TouchableOpacity
            onPress={() => setShowNewFolderModal(true)}
            style={styles.addButton}
          >
            <Feather name="folder-plus" size={20} color={colors.accentGradientStart} />
          </TouchableOpacity>
        )}
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
            {filteredAndSortedFiles.map((file) => (
              <View key={file.id} style={styles.fileGridItem}>
                <FileItem
                  name={file.name}
                  extension={file.extension}
                  icon={getFileIcon(file.type, 40, file.path ? folderColors[file.path] : undefined)}
                  thumbnailUri={file.thumbnailUri}
                  onPress={() => handleFilePress(file)}
                  onLongPress={() => handleFileLongPress(file)}
                  variant="solid"
                />
              </View>
            ))}
          </View>

          {filteredAndSortedFiles.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="folder" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aucun résultat' : 'Dossier vide'}
              </Text>
              {!searchQuery && canCreateFolder && (
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

            {/* Aperçu du dossier */}
            <View style={styles.folderPreview}>
              <FolderIcon size={60} color={selectedColor} />
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Nom du dossier"
              placeholderTextColor={colors.textMuted}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />

            {/* Sélecteur de couleur */}
            <Text style={styles.colorPickerLabel}>Couleur du dossier</Text>
            <View style={styles.colorPicker}>
              {FOLDER_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Feather name="check" size={16} color={colors.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                  setSelectedColor(FOLDER_COLORS[0]);
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

      {/* Modal de tri */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sortModalContent}>
            <Text style={styles.modalTitle}>Trier par</Text>

            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOptionItem,
                  sortBy === option.value && styles.sortOptionItemSelected,
                ]}
                onPress={() => handleSortChange(option.value)}
              >
                <Feather
                  name={option.icon as any}
                  size={20}
                  color={sortBy === option.value ? colors.accentGradientStart : colors.textMuted}
                />
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option.value && styles.sortOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Feather
                    name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                    size={18}
                    color={colors.accentGradientStart}
                  />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.sortModalCloseButton}
              onPress={() => setShowSortModal(false)}
            >
              <Text style={styles.sortModalCloseText}>Fermer</Text>
            </TouchableOpacity>
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
  folderPreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  colorPickerLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 8,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  // Sort button styles
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: borderRadius.sm,
  },
  sortButtonText: {
    color: colors.accentGradientStart,
    fontSize: 12,
    fontWeight: '500',
  },
  // Sort modal styles
  sortModalContent: {
    width: SCREEN_WIDTH - 80,
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.lg,
    padding: 20,
  },
  sortOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    marginBottom: 4,
  },
  sortOptionItemSelected: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  sortOptionText: {
    flex: 1,
    fontSize: 16,
    color: colors.textDark,
  },
  sortOptionTextSelected: {
    color: colors.accentGradientStart,
    fontWeight: '600',
  },
  sortModalCloseButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: borderRadius.sm,
  },
  sortModalCloseText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
});

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
  Modal,
  TextInput,
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
import { FileSystemService, StorageInfo, StorageSource } from '../services/fileSystem';
import { FileItem as FileItemType } from '../types';

// Délai de debounce pour la recherche (ms)
const SEARCH_DEBOUNCE = 300;

const FOLDER_COLORS_STORAGE_KEY = 'folder_colors';

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
  const [isSearching, setIsSearching] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [files, setFiles] = useState<FileItemType[]>([]);
  const [searchResults, setSearchResults] = useState<FileItemType[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalFolders, setTotalFolders] = useState(0);
  const [folderColors, setFolderColors] = useState<Record<string, string>>({});
  const [storageSources, setStorageSources] = useState<StorageSource[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // État pour la création de dossier
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);

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

  // Sauvegarder la couleur d'un dossier
  const saveFolderColor = async (folderPath: string, color: string) => {
    try {
      const newColors = { ...folderColors, [folderPath]: color };
      await AsyncStorage.setItem(FOLDER_COLORS_STORAGE_KEY, JSON.stringify(newColors));
      setFolderColors(newColors);
    } catch (error) {
      console.error('Error saving folder color:', error);
    }
  };

  // Créer un nouveau dossier dans Documents
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de dossier');
      return;
    }

    try {
      const documentsPath = await FileSystemService.getRootDirectories();
      const docsFolder = documentsPath.find(f => f.id === 'documents');

      if (!docsFolder?.path) {
        Alert.alert('Erreur', 'Impossible de trouver le dossier Documents');
        return;
      }

      const result = await FileSystemService.createFolder(docsFolder.path, newFolderName.trim());

      if (result.success && result.path) {
        await saveFolderColor(result.path, selectedColor);
        setShowNewFolderModal(false);
        setNewFolderName('');
        setSelectedColor(FOLDER_COLORS[0]);
        await loadFiles();
        Alert.alert('Succès', 'Dossier créé avec succès');
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de créer le dossier');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création du dossier');
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
      await Promise.all([loadFiles(), loadStorageInfo(), loadStorageSources()]);
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
    await Promise.all([loadFiles(), loadStorageInfo(), loadStorageSources()]);
    setIsRefreshing(false);
  };

  const loadStorageSources = async () => {
    try {
      const sources = await FileSystemService.getStorageSources();
      setStorageSources(sources);
    } catch (error) {
      console.error('Error loading storage sources:', error);
    }
  };

  const handleImportFiles = async () => {
    Vibration.vibrate(10);
    Alert.alert(
      'Importer des fichiers',
      'Choisissez le type de fichiers à importer',
      [
        {
          text: 'Tous les fichiers',
          onPress: () => importFilesOfType('all'),
        },
        {
          text: 'Images',
          onPress: () => importFilesOfType('image'),
        },
        {
          text: 'Vidéos',
          onPress: () => importFilesOfType('video'),
        },
        {
          text: 'Audio',
          onPress: () => importFilesOfType('audio'),
        },
        {
          text: 'Documents',
          onPress: () => importFilesOfType('document'),
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const importFilesOfType = async (fileType: 'image' | 'video' | 'audio' | 'document' | 'all') => {
    setIsImporting(true);
    try {
      const result = await FileSystemService.pickFiles(fileType);
      if (result.success && result.files.length > 0) {
        Alert.alert(
          'Succès',
          `${result.files.length} fichier(s) importé(s) dans Documents`,
          [{ text: 'OK', onPress: () => loadFiles() }]
        );
      } else if (result.error && result.error !== 'Annulé') {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'importation');
    } finally {
      setIsImporting(false);
    }
  };

  // Effectuer la recherche globale
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await FileSystemService.searchFiles(query, 50);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    // Annuler la recherche précédente
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Debounce la recherche
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, SEARCH_DEBOUNCE);
  }, []);

  // Fichiers à afficher (résultats de recherche ou dossiers racine)
  const displayFiles = searchQuery.trim() ? searchResults : files;

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
        { text: 'Importer des fichiers', onPress: handleImportFiles },
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
        {/* Boutons Menu et Import */}
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
            <MenuIcon size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleImportFiles}
            style={styles.importButton}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Feather name="download-cloud" size={22} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>

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

        {/* Sources de stockage */}
        <View style={styles.storageSourcesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storageSourcesScroll}
          >
            {storageSources.filter(s => s.type === 'cloud' || s.type === 'external').map((source) => (
              <TouchableOpacity
                key={source.id}
                style={styles.storageSourceItem}
                onPress={handleImportFiles}
              >
                <View style={[
                  styles.storageSourceIcon,
                  source.type === 'cloud' && styles.storageSourceIconCloud,
                ]}>
                  <Feather
                    name={source.icon as any}
                    size={18}
                    color={source.type === 'cloud' ? colors.accentGradientStart : colors.white}
                  />
                </View>
                <Text style={styles.storageSourceName} numberOfLines={1}>
                  {source.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Indicateur de résultats de recherche */}
      {searchQuery.trim() && (
        <View style={styles.searchResultsHeader}>
          <Feather name="search" size={16} color={colors.textMuted} />
          <Text style={styles.searchResultsText}>
            {isSearching
              ? 'Recherche en cours...'
              : `${searchResults.length} résultat${searchResults.length !== 1 ? 's' : ''} pour "${searchQuery}"`
            }
          </Text>
          {searchQuery.trim() && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearSearchButton}>
              <Feather name="x" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Grille des fichiers */}
      <View style={styles.filesContainer}>
        {isSearching ? (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="large" color={colors.accentGradientStart} />
            <Text style={styles.loadingText}>Recherche en cours...</Text>
          </View>
        ) : (
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
              {displayFiles.map((file) => (
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

            {displayFiles.length === 0 && !isLoading && (
              <View style={styles.emptyState}>
                <Feather name={searchQuery ? 'search' : 'folder'} size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Aucun fichier trouvé' : 'Aucun dossier accessible'}
                </Text>
                {!hasPermission && !searchQuery && (
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
        )}
      </View>

      {/* Bouton flottant pour créer un dossier */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Vibration.vibrate(10);
          setShowNewFolderModal(true);
        }}
      >
        <LinearGradient
          colors={gradients.accent as [string, string]}
          style={styles.fabGradient}
        >
          <Feather name="folder-plus" size={24} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>

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
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuButton: {
    padding: 8,
  },
  importButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.sm,
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
  searchResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.cardBgAlt,
  },
  searchResultsText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
  },
  clearSearchButton: {
    padding: 4,
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Storage sources styles
  storageSourcesContainer: {
    marginTop: 16,
  },
  storageSourcesScroll: {
    paddingRight: 20,
  },
  storageSourceItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  storageSourceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  storageSourceIconCloud: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },
  storageSourceName: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  // FAB styles
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 30,
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
});

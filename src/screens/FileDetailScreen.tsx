import React, { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { Video, ResizeMode } from 'expo-av';

import {
  ImageIcon,
  VideoIcon,
  AudioIcon,
  DocumentIcon,
  ArchiveIcon,
  AppIcon,
} from '../components/FileIcons';
import { colors, gradients, borderRadius, neuShadow } from '../theme/colors';
import { FileSystemService } from '../services/fileSystem';
import { FileItem as FileItemType } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Folder: { folderId: string; folderName: string; path: string };
  FileDetail: { file: FileItemType };
};

type FileDetailRouteProp = RouteProp<RootStackParamList, 'FileDetail'>;

function getFileIcon(type: FileItemType['type'], size = 80) {
  switch (type) {
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
  if (!bytes) return 'Inconnu';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(date?: Date): string {
  if (!date) return 'Inconnu';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTypeName(type: FileItemType['type']): string {
  const names: Record<string, string> = {
    document: 'Document',
    image: 'Image',
    video: 'Vidéo',
    audio: 'Audio',
    archive: 'Archive',
    app: 'Application',
    folder: 'Dossier',
    link: 'Lien',
    unknown: 'Fichier',
  };
  return names[type] || 'Fichier';
}

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    // Videos
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.webm': 'video/webm',
    '.m4v': 'video/mp4',
    '.3gp': 'video/3gpp',
    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.wma': 'audio/x-ms-wma',
    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.xml': 'text/xml',
    '.html': 'text/html',
    // Archives
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    // Apps
    '.apk': 'application/vnd.android.package-archive',
  };
  return mimeTypes[extension.toLowerCase()] || '*/*';
}

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

function ActionButton({ icon, label, onPress, color = colors.accentGradientStart }: ActionButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionButton} activeOpacity={0.7}>
      <View style={[styles.actionIconContainer, { backgroundColor: color }]}>
        <Feather name={icon as any} size={20} color={colors.white} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function FileDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<FileDetailRouteProp>();
  const { file } = route.params;

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const videoRef = useRef<Video>(null);

  const handleBack = useCallback(() => {
    Vibration.vibrate(10);
    navigation.goBack();
  }, [navigation]);

  // Obtenir l'URI locale pour les assets média
  const getLocalUri = async (): Promise<string | null> => {
    if (!file.path) return null;

    // Si c'est un asset MediaLibrary
    if (file.isMediaAsset) {
      try {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(file.id);
        return assetInfo?.localUri || file.path;
      } catch {
        return file.path;
      }
    }
    return file.path;
  };

  const handleOpen = useCallback(async () => {
    Vibration.vibrate(10);
    setIsLoadingMedia(true);

    // Obtenir l'URI locale
    const uri = await getLocalUri();
    const mediaUri = uri || file.path || null;

    // Pour les images, ouvrir le viewer plein écran
    if (file.type === 'image') {
      setImageUri(mediaUri);
      setShowImageViewer(true);
      setIsLoadingMedia(false);
      return;
    }

    // Pour les vidéos, ouvrir le lecteur vidéo intégré
    if (file.type === 'video') {
      setVideoUri(mediaUri);
      setShowVideoPlayer(true);
      setIsLoadingMedia(false);
      return;
    }

    // Pour les autres fichiers (audio, documents, etc.)
    setIsLoadingMedia(false);
    if (file.path) {
      const mimeType = getMimeType(file.extension);
      const success = await FileSystemService.openFile(file.path, mimeType, file.isMediaAsset);
      if (!success) {
        Alert.alert('Erreur', 'Impossible d\'ouvrir ce fichier. Essayez de le partager.');
      }
    }
  }, [file]);

  const handleShare = useCallback(async () => {
    Vibration.vibrate(10);
    if (file.path) {
      const success = await FileSystemService.share(file.path);
      if (!success) {
        Alert.alert('Erreur', 'Impossible de partager ce fichier');
      }
    }
  }, [file]);

  const handleRename = useCallback(async () => {
    if (!newName.trim() || newName === file.name) {
      setShowRenameModal(false);
      return;
    }

    // Pour les assets MediaLibrary, le renommage n'est pas supporté
    if (file.isMediaAsset) {
      Alert.alert('Non supporté', 'Le renommage des fichiers média n\'est pas supporté par le système.');
      setShowRenameModal(false);
      return;
    }

    if (file.path) {
      const success = await FileSystemService.rename(file.path, newName.trim());
      if (success) {
        Alert.alert('Succès', 'Fichier renommé avec succès');
        navigation.goBack();
      } else {
        Alert.alert('Erreur', 'Impossible de renommer ce fichier');
      }
    }
    setShowRenameModal(false);
  }, [file, newName, navigation]);

  const handleMove = useCallback(() => {
    Vibration.vibrate(10);
    Alert.alert(
      'Déplacer',
      'Cette fonctionnalité n\'est pas encore disponible.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleCopy = useCallback(() => {
    Vibration.vibrate(10);
    Alert.alert(
      'Copier',
      'Cette fonctionnalité n\'est pas encore disponible.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleDelete = useCallback(() => {
    Vibration.vibrate(30);
    Alert.alert(
      'Supprimer',
      `Voulez-vous vraiment supprimer "${file.name}${file.extension}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);

            // Pour les assets MediaLibrary
            if (file.isMediaAsset) {
              try {
                const result = await MediaLibrary.deleteAssetsAsync([file.id]);
                if (result) {
                  navigation.goBack();
                } else {
                  Alert.alert('Erreur', 'Impossible de supprimer ce fichier');
                }
              } catch (error) {
                Alert.alert('Erreur', 'Impossible de supprimer ce fichier. Vérifiez les permissions.');
              } finally {
                setIsDeleting(false);
              }
              return;
            }

            // Pour les fichiers normaux
            if (file.path) {
              const success = await FileSystemService.delete(file.path);
              if (success) {
                navigation.goBack();
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer ce fichier');
              }
            }
            setIsDeleting(false);
          },
        },
      ]
    );
  }, [file, navigation]);

  const isImage = file.type === 'image';
  const isVideo = file.type === 'video';
  const displayUri = file.thumbnailUri || file.path;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails</Text>
        <TouchableOpacity style={styles.moreButton} onPress={handleShare}>
          <Feather name="share-2" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Aperçu du fichier */}
        <LinearGradient
          colors={gradients.darkCard as [string, string]}
          style={styles.previewCard}
        >
          {(isImage || isVideo) && displayUri ? (
            <TouchableOpacity onPress={handleOpen} activeOpacity={0.8}>
              <Image
                source={{ uri: displayUri }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
              {isVideo && (
                <View style={styles.playOverlay}>
                  <View style={styles.playButton}>
                    <Feather name="play" size={40} color={colors.white} />
                  </View>
                </View>
              )}
              <Text style={styles.tapToOpen}>Appuyez pour ouvrir</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.fileIconLarge}>
              {getFileIcon(file.type, 80)}
            </View>
          )}
          <Text style={styles.fileName} numberOfLines={2}>
            {file.name}{file.extension}
          </Text>
          <Text style={styles.fileType}>
            {getTypeName(file.type)}
          </Text>
        </LinearGradient>

        {/* Informations du fichier */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informations</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Taille</Text>
            <Text style={styles.infoValue}>{formatFileSize(file.size)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{file.extension || 'Dossier'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Modifié</Text>
            <Text style={styles.infoValue}>{formatDate(file.modifiedAt)}</Text>
          </View>

          {file.path && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Chemin</Text>
              <Text style={styles.infoValuePath} numberOfLines={2}>
                {file.path.split('/').slice(-3).join('/')}
              </Text>
            </View>
          )}
        </View>

        {/* Actions rapides */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <View style={styles.actionsGrid}>
            <ActionButton icon="external-link" label="Ouvrir" onPress={handleOpen} />
            <ActionButton icon="share-2" label="Partager" onPress={handleShare} color={colors.syncBlue} />
            <ActionButton
              icon="edit-2"
              label="Renommer"
              onPress={() => {
                if (file.isMediaAsset) {
                  Alert.alert('Non supporté', 'Le renommage des fichiers média n\'est pas supporté.');
                } else {
                  setShowRenameModal(true);
                }
              }}
              color={colors.folderOrange}
            />
            <ActionButton icon="folder" label="Déplacer" onPress={handleMove} color={colors.audioPurple} />
            <ActionButton icon="copy" label="Copier" onPress={handleCopy} color={colors.success} />
            <ActionButton
              icon="trash-2"
              label={isDeleting ? "..." : "Supprimer"}
              onPress={handleDelete}
              color={colors.audioRed}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bouton principal */}
      <View style={styles.bottomAction}>
        <TouchableOpacity onPress={handleOpen} activeOpacity={0.8} disabled={isLoadingMedia}>
          <LinearGradient
            colors={gradients.accent as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.openButton}
          >
            {isLoadingMedia ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Feather name="play" size={20} color={colors.white} />
                <Text style={styles.openButtonText}>Ouvrir le fichier</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modal Renommer */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Renommer</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nouveau nom"
              placeholderTextColor={colors.textMuted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowRenameModal(false);
                  setNewName(file.name);
                }}
              >
                <Text style={styles.modalButtonCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleRename}
              >
                <Text style={styles.modalButtonConfirmText}>Renommer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Image Viewer */}
      <Modal
        visible={showImageViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <StatusBar hidden={showImageViewer} />
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setShowImageViewer(false)}
          >
            <Feather name="x" size={28} color={colors.white} />
          </TouchableOpacity>

          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}

          <View style={styles.imageViewerActions}>
            <TouchableOpacity style={styles.imageViewerButton} onPress={handleShare}>
              <Feather name="share-2" size={24} color={colors.white} />
              <Text style={styles.imageViewerButtonText}>Partager</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageViewerButton} onPress={handleDelete}>
              <Feather name="trash-2" size={24} color={colors.audioRed} />
              <Text style={[styles.imageViewerButtonText, { color: colors.audioRed }]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Video Player */}
      <Modal
        visible={showVideoPlayer}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowVideoPlayer(false);
          videoRef.current?.stopAsync();
        }}
      >
        <StatusBar hidden={showVideoPlayer} />
        <View style={styles.videoPlayerContainer}>
          <TouchableOpacity
            style={styles.videoPlayerClose}
            onPress={() => {
              setShowVideoPlayer(false);
              videoRef.current?.stopAsync();
            }}
          >
            <Feather name="x" size={28} color={colors.white} />
          </TouchableOpacity>

          {videoUri && (
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={styles.videoPlayer}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping={false}
            />
          )}

          <View style={styles.videoPlayerActions}>
            <TouchableOpacity style={styles.imageViewerButton} onPress={handleShare}>
              <Feather name="share-2" size={24} color={colors.white} />
              <Text style={styles.imageViewerButtonText}>Partager</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageViewerButton}
              onPress={() => {
                setShowVideoPlayer(false);
                handleDelete();
              }}
            >
              <Feather name="trash-2" size={24} color={colors.audioRed} />
              <Text style={[styles.imageViewerButtonText, { color: colors.audioRed }]}>Supprimer</Text>
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
  scrollContent: {
    paddingBottom: 160,
  },
  previewCard: {
    margin: 16,
    padding: 32,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...neuShadow.card,
  },
  imagePreview: {
    width: SCREEN_WIDTH - 96,
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: 20,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 5,
  },
  tapToOpen: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 10,
  },
  fileIconLarge: {
    marginBottom: 20,
  },
  fileName: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  fileType: {
    color: colors.textMuted,
    fontSize: 14,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  infoValue: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '500',
  },
  infoValuePath: {
    color: colors.textMuted,
    fontSize: 12,
    maxWidth: '60%',
    textAlign: 'right',
  },
  actionsCard: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: colors.textDark,
    fontSize: 12,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
  },
  openButtonText: {
    color: colors.white,
    fontSize: 16,
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
  // Image Viewer styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 150,
  },
  imageViewerActions: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  imageViewerButton: {
    alignItems: 'center',
    padding: 10,
  },
  imageViewerButtonText: {
    color: colors.white,
    fontSize: 12,
    marginTop: 4,
  },
  // Video Player styles
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  videoPlayer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200,
  },
  videoPlayerActions: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
});

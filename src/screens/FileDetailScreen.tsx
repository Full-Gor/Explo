import React, { useCallback, useState } from 'react';
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  ImageIcon,
  AudioIcon,
  DocumentIcon,
  ArchiveIcon,
  AppIcon,
} from '../components/FileIcons';
import { colors, gradients, borderRadius, neuShadow } from '../theme/colors';
import { FileSystemService } from '../services/fileSystem';
import { FileItem as FileItemType } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
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
  const [newName, setNewName] = useState(file.name);

  const handleBack = useCallback(() => {
    Vibration.vibrate(10);
    navigation.goBack();
  }, [navigation]);

  const handleOpen = useCallback(async () => {
    Vibration.vibrate(10);
    if (file.path) {
      const mimeType = getMimeType(file.extension);
      const success = await FileSystemService.openFile(file.path, mimeType);
      if (!success) {
        Alert.alert('Erreur', 'Impossible d\'ouvrir ce fichier');
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
      'Cette fonctionnalité nécessite un sélecteur de dossier. À implémenter avec un navigateur de dossiers.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleCopy = useCallback(() => {
    Vibration.vibrate(10);
    Alert.alert(
      'Copier',
      'Cette fonctionnalité nécessite un sélecteur de dossier de destination. À implémenter.',
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
            if (file.path) {
              const success = await FileSystemService.delete(file.path);
              if (success) {
                navigation.goBack();
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer ce fichier');
              }
            }
          },
        },
      ]
    );
  }, [file, navigation]);

  const isImage = file.type === 'image' && file.path;

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
          {isImage ? (
            <Image
              source={{ uri: file.path }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
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
            <ActionButton icon="edit-2" label="Renommer" onPress={() => setShowRenameModal(true)} color={colors.folderOrange} />
            <ActionButton icon="folder" label="Déplacer" onPress={handleMove} color={colors.audioPurple} />
            <ActionButton icon="copy" label="Copier" onPress={handleCopy} color={colors.success} />
            <ActionButton icon="trash-2" label="Supprimer" onPress={handleDelete} color={colors.audioRed} />
          </View>
        </View>
      </ScrollView>

      {/* Bouton principal */}
      <View style={styles.bottomAction}>
        <TouchableOpacity onPress={handleOpen} activeOpacity={0.8}>
          <LinearGradient
            colors={gradients.accent as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.openButton}
          >
            <Feather name="play" size={20} color={colors.white} />
            <Text style={styles.openButtonText}>Ouvrir le fichier</Text>
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
    paddingBottom: 100,
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
    bottom: 0,
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
});

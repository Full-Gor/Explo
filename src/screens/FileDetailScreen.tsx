import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  ImageIcon,
  AudioIcon,
  DocumentIcon,
  ArchiveIcon,
} from '../components/FileIcons';
import { colors, gradients, borderRadius, neuShadow } from '../theme/colors';
import { FileItem as FileItemType } from '../types';

type RootStackParamList = {
  Home: undefined;
  Folder: { folderId: string; folderName: string };
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
    case 'document':
    default:
      return <DocumentIcon size={size} />;
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '2.4 MB'; // Valeur de démonstration
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
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

  const handleBack = useCallback(() => {
    Vibration.vibrate(10);
    navigation.goBack();
  }, [navigation]);

  const handleOpen = useCallback(() => {
    Vibration.vibrate(10);
    Alert.alert('Ouvrir', `Ouverture de ${file.name}${file.extension}`);
  }, [file]);

  const handleShare = useCallback(() => {
    Vibration.vibrate(10);
    Alert.alert('Partager', `Partage de ${file.name}${file.extension}`);
  }, [file]);

  const handleRename = useCallback(() => {
    Vibration.vibrate(10);
    Alert.alert('Renommer', 'Fonctionnalité à implémenter');
  }, []);

  const handleMove = useCallback(() => {
    Vibration.vibrate(10);
    Alert.alert('Déplacer', 'Fonctionnalité à implémenter');
  }, []);

  const handleCopy = useCallback(() => {
    Vibration.vibrate(10);
    Alert.alert('Copier', 'Fonctionnalité à implémenter');
  }, []);

  const handleDelete = useCallback(() => {
    Vibration.vibrate(30);
    Alert.alert(
      'Supprimer',
      `Voulez-vous vraiment supprimer ${file.name}${file.extension} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  }, [file, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Feather name="more-vertical" size={24} color={colors.white} />
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
          <View style={styles.fileIconLarge}>
            {getFileIcon(file.type, 80)}
          </View>
          <Text style={styles.fileName} numberOfLines={2}>
            {file.name}{file.extension}
          </Text>
          <Text style={styles.fileType}>
            {file.type === 'document' ? 'Document' :
             file.type === 'image' ? 'Image' :
             file.type === 'audio' ? 'Audio' :
             file.type === 'archive' ? 'Archive' : 'Fichier'}
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
            <Text style={styles.infoValue}>Aujourd'hui, 14:30</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Créé</Text>
            <Text style={styles.infoValue}>15 déc. 2024</Text>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <View style={styles.actionsGrid}>
            <ActionButton icon="external-link" label="Ouvrir" onPress={handleOpen} />
            <ActionButton icon="share-2" label="Partager" onPress={handleShare} color={colors.syncBlue} />
            <ActionButton icon="edit-2" label="Renommer" onPress={handleRename} color={colors.folderOrange} />
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
});

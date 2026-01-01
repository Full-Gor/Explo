import React, { useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { FileItem } from '../components';
import {
  FolderIcon,
  ImageIcon,
  AudioIcon,
  DocumentIcon,
  ArchiveIcon,
  ClockIcon,
} from '../components/FileIcons';
import { colors, borderRadius } from '../theme/colors';
import { FileItem as FileItemType } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Folder: { folderId: string; folderName: string };
  FileDetail: { file: FileItemType };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Fichiers récents de démonstration
const RECENT_FILES: (FileItemType & { accessedAt: string })[] = [
  { id: 'r1', name: 'Présentation', extension: '.pptx', type: 'document', accessedAt: 'Il y a 5 min' },
  { id: 'r2', name: 'Photo vacances', extension: '.jpg', type: 'image', accessedAt: 'Il y a 15 min' },
  { id: 'r3', name: 'Podcast #42', extension: '.mp3', type: 'audio', accessedAt: 'Il y a 1 heure' },
  { id: 'r4', name: 'Budget 2024', extension: '.xlsx', type: 'document', accessedAt: 'Il y a 2 heures' },
  { id: 'r5', name: 'Backup', extension: '.zip', type: 'archive', accessedAt: 'Hier' },
  { id: 'r6', name: 'Notes réunion', extension: '.txt', type: 'document', accessedAt: 'Hier' },
  { id: 'r7', name: 'Capture écran', extension: '.png', type: 'image', accessedAt: 'Il y a 2 jours' },
  { id: 'r8', name: 'Chanson', extension: '.m4a', type: 'audio', accessedAt: 'Il y a 3 jours' },
  { id: 'r9', name: 'CV', extension: '.pdf', type: 'document', accessedAt: 'La semaine dernière' },
  { id: 'r10', name: 'Archive projet', extension: '.rar', type: 'archive', accessedAt: 'La semaine dernière' },
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

export function RecentScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  const handleFilePress = useCallback((file: FileItemType) => {
    Vibration.vibrate(10);
    navigation.navigate('FileDetail', { file });
  }, [navigation]);

  const handleFileLongPress = useCallback((file: FileItemType) => {
    Vibration.vibrate(50);
  }, []);

  const handleClearRecent = useCallback(() => {
    Vibration.vibrate(30);
    // TODO: Effacer l'historique des fichiers récents
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ClockIcon size={24} />
          <Text style={styles.headerTitle}>{t('files.recents')}</Text>
        </View>
        <TouchableOpacity onPress={handleClearRecent} style={styles.clearButton}>
          <Feather name="trash-2" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Liste des fichiers récents */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {RECENT_FILES.map((file) => (
          <TouchableOpacity
            key={file.id}
            style={styles.fileRow}
            onPress={() => handleFilePress(file)}
            onLongPress={() => handleFileLongPress(file)}
            activeOpacity={0.7}
          >
            <View style={styles.fileIconContainer}>
              {getFileIcon(file.type, 36)}
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}{file.extension}
              </Text>
              <Text style={styles.fileDate}>{file.accessedAt}</Text>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <Feather name="more-vertical" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {RECENT_FILES.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="clock" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucun fichier récent</Text>
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.cardBg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '600',
  },
  clearButton: {
    padding: 8,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 100,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.cardLight,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: borderRadius.md,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  moreButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    color: colors.textMuted,
    fontSize: 16,
  },
});

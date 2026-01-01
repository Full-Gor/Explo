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
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import {
  FolderIcon,
  ImageIcon,
  VideoIcon,
  AudioIcon,
  DocumentIcon,
  ArchiveIcon,
  ClockIcon,
} from '../components/FileIcons';
import { colors, borderRadius } from '../theme/colors';
import { FileItem as FileItemType } from '../types';
import { FileSystemService } from '../services/fileSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Folder: { folderId: string; folderName: string; path: string };
  FileDetail: { file: FileItemType };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
    case 'document':
    default:
      return <DocumentIcon size={size} />;
  }
}

function formatRelativeDate(date?: Date): string {
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  return date.toLocaleDateString('fr-FR');
}

export function RecentScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  const [files, setFiles] = useState<FileItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadRecentFiles = async () => {
    try {
      const recentFiles = await FileSystemService.getRecentFiles(50);
      setFiles(recentFiles);
    } catch (error) {
      console.error('Error loading recent files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecentFiles();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecentFiles();
    }, [])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRecentFiles();
    setIsRefreshing(false);
  };

  const handleFilePress = useCallback((file: FileItemType) => {
    Vibration.vibrate(10);
    navigation.navigate('FileDetail', { file });
  }, [navigation]);

  const handleFileLongPress = useCallback((file: FileItemType) => {
    Vibration.vibrate(50);
    Alert.alert(
      file.name + file.extension,
      'Options',
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

  const handleClearRecent = useCallback(() => {
    Vibration.vibrate(30);
    Alert.alert(
      'Effacer l\'historique',
      'Cette fonctionnalité n\'est pas disponible car les fichiers récents sont basés sur les médias du système.',
      [{ text: 'OK' }]
    );
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ClockIcon size={24} />
            <Text style={styles.headerTitle}>{t('files.recents')}</Text>
          </View>
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
        <View style={styles.headerLeft}>
          <ClockIcon size={24} />
          <Text style={styles.headerTitle}>{t('files.recents')}</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.clearButton}>
          <Feather name="refresh-cw" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Liste des fichiers récents */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accentGradientStart}
          />
        }
      >
        {files.map((file) => (
          <TouchableOpacity
            key={file.id}
            style={styles.fileRow}
            onPress={() => handleFilePress(file)}
            onLongPress={() => handleFileLongPress(file)}
            activeOpacity={0.7}
          >
            <View style={styles.fileIconContainer}>
              {file.thumbnailUri ? (
                <Image
                  source={{ uri: file.thumbnailUri }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              ) : (
                getFileIcon(file.type, 36)
              )}
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}{file.extension}
              </Text>
              <Text style={styles.fileDate}>{formatRelativeDate(file.modifiedAt)}</Text>
            </View>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => handleFileLongPress(file)}
            >
              <Feather name="more-vertical" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {files.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="clock" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucun fichier récent</Text>
            <Text style={styles.emptySubtext}>
              Les photos, vidéos et fichiers audio récemment modifiés apparaîtront ici
            </Text>
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
    paddingBottom: 120,
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
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
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
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    color: colors.textMuted,
    fontSize: 16,
  },
  emptySubtext: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
  },
});

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';

import { NeuButton, SearchBar, ProgressBar, FileItem, CalendarStrip, GlassCard } from '../components';
import {
  FolderIcon,
  ImageIcon,
  AudioIcon,
  ChartIcon,
  DocumentIcon,
  ArchiveIcon,
  DropboxIcon,
  ColorWheelIcon,
  GlobeIcon,
  FiletypeIcon,
  AppIcon,
  SyncIcon,
  HomeIcon,
  MenuIcon,
  ClockIcon,
} from '../components/FileIcons';
import { colors, gradients, borderRadius, neuShadow } from '../theme/colors';
import { StorageService } from '../services/storage';
import { CalendarDay } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHONE_WIDTH = SCREEN_WIDTH * 0.85;
const PHONE_HEIGHT = SCREEN_HEIGHT * 0.78;

interface FileData {
  id: string;
  name: string;
  extension: string;
  icon: React.ReactNode;
}

export function FileExplorerScreen() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const folderStats = StorageService.getFolderStats();
  const storageInfo = StorageService.getStorageInfo();

  const mainFiles: FileData[] = [
    { id: '1', name: 'Assets', extension: 'folder', icon: <FolderIcon /> },
    { id: '2', name: 'Stuff', extension: 'folder', icon: <FolderIcon /> },
    { id: '3', name: 'Mountain', extension: '.jpeg', icon: <ImageIcon /> },
    { id: '4', name: 'Record', extension: '.mp3', icon: <AudioIcon /> },
    { id: '5', name: 'Results', extension: '.xls', icon: <ChartIcon /> },
    { id: '6', name: 'Project', extension: '.docx', icon: <DocumentIcon /> },
  ];

  const recentFiles: FileData[] = [
    { id: '7', name: 'Archive', extension: '.zip', icon: <ArchiveIcon /> },
    { id: '8', name: 'Illustration', extension: '.eps', icon: <DropboxIcon /> },
    { id: '9', name: 'Artwork', extension: '.psd', icon: <ColorWheelIcon /> },
    { id: '10', name: 'Site', extension: '.link', icon: <GlobeIcon /> },
    { id: '11', name: 'Filetype', extension: '.unknown', icon: <FiletypeIcon /> },
    { id: '12', name: 'App', extension: '.xcode', icon: <AppIcon /> },
  ];

  const calendarDays: CalendarDay[] = [
    { number: 15, label: t('calendar.aug'), isActive: true },
    { number: 14, label: '', isActive: false },
    { number: 13, label: '', isActive: false },
    { number: 12, label: '', isActive: false },
    { number: 11, label: '', isActive: false },
  ];

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleVoiceSearch = useCallback(() => {
    Vibration.vibrate(50);
    // Voice search implementation would go here
  }, []);

  const handleSync = useCallback(() => {
    Vibration.vibrate(30);
    // Sync implementation would go here
  }, []);

  const handleFilePress = useCallback((file: FileData) => {
    Vibration.vibrate(10);
    // File navigation would go here
  }, []);

  const handleFileLongPress = useCallback((file: FileData) => {
    Vibration.vibrate(50);
    // Context menu would go here
  }, []);

  const handleDayPress = useCallback((day: CalendarDay, index: number) => {
    // Calendar day selection would go here
  }, []);

  return (
    <LinearGradient
      colors={gradients.background as [string, string, string]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <StatusBar style="light" />

      <View style={styles.phonesWrapper}>
        {/* Main Phone Card */}
        <View style={styles.mainPhone}>
          {/* Home Button */}
          <View style={styles.homeButtonContainer}>
            <NeuButton
              variant="rounded"
              size={40}
              onPress={() => Vibration.vibrate(10)}
            >
              <HomeIcon size={24} />
            </NeuButton>
          </View>

          <View style={styles.phoneInner}>
            {/* Dark Header Card */}
            <LinearGradient
              colors={gradients.darkCard as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.darkCard}
            >
              {/* Menu Button */}
              <View style={styles.menuButton}>
                <MenuIcon size={24} />
              </View>

              {/* Search Bar */}
              <SearchBar
                onSearch={handleSearch}
                onVoiceSearch={handleVoiceSearch}
                placeholder={t('common.search')}
              />

              {/* Doc Info */}
              <View style={styles.docInfo}>
                <LinearGradient
                  colors={gradients.accent as [string, string]}
                  style={styles.docIcon}
                >
                  <View style={styles.docIconInner} />
                </LinearGradient>
                <View style={styles.docText}>
                  <Text style={styles.docTitle}>{t('files.myDocs')}</Text>
                  <Text style={styles.docSubtitle}>
                    {t('files.filesAndFolders', {
                      files: folderStats.totalFiles,
                      folders: folderStats.totalFolders,
                    })}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={storageInfo.percentage}
                  label={t('files.freeSpace', { space: `${storageInfo.free} GB` })}
                />
              </View>
            </LinearGradient>

            {/* Files Grid Section */}
            <View style={styles.filesSection}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.filesScrollContent}
              >
                <View style={styles.filesGrid}>
                  {mainFiles.map((file) => (
                    <View key={file.id} style={styles.fileGridItem}>
                      <FileItem
                        name={file.name}
                        extension={file.extension}
                        icon={file.icon}
                        onPress={() => handleFilePress(file)}
                        onLongPress={() => handleFileLongPress(file)}
                        variant="solid"
                      />
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Sync Button */}
              <View style={styles.syncButtonContainer}>
                <NeuButton
                  variant="circle"
                  size={48}
                  onPress={handleSync}
                >
                  <SyncIcon size={24} color={colors.syncBlue} />
                </NeuButton>
              </View>
            </View>
          </View>
        </View>

        {/* Glass Phone Card (Recents) */}
        <View style={styles.glassPhone}>
          {/* Recents Header */}
          <View style={styles.recentsHeader}>
            <ClockIcon size={16} />
            <Text style={styles.recentsText}>{t('files.recents')}</Text>
          </View>

          {/* Glass Files Grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.glassScrollContent}
          >
            <View style={styles.glassGrid}>
              {recentFiles.map((file) => (
                <View key={file.id} style={styles.glassGridItem}>
                  <FileItem
                    name={file.name}
                    extension={file.extension}
                    icon={file.icon}
                    onPress={() => handleFilePress(file)}
                    onLongPress={() => handleFileLongPress(file)}
                    variant="glass"
                  />
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Decorative Wave */}
          <View style={styles.wave} />

          {/* Glass Sync Button */}
          <View style={styles.glassSyncContainer}>
            <View style={styles.glassSyncButton}>
              <SyncIcon size={20} color={colors.white} />
            </View>
          </View>

          {/* Calendar Strip */}
          <CalendarStrip days={calendarDays} onDayPress={handleDayPress} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  phonesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainPhone: {
    width: PHONE_WIDTH * 0.95,
    height: PHONE_HEIGHT,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.phone,
    padding: 16,
    zIndex: 2,
    ...neuShadow.card,
  },
  homeButtonContainer: {
    position: 'absolute',
    left: -20,
    top: '50%',
    transform: [{ translateY: -20 }],
    zIndex: 10,
  },
  phoneInner: {
    flex: 1,
    gap: 12,
  },
  darkCard: {
    borderRadius: borderRadius.xl,
    padding: 20,
    ...neuShadow.card,
  },
  menuButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  docInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  docIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...neuShadow.raised,
  },
  docIconInner: {
    width: 28,
    height: 28,
    backgroundColor: colors.white,
    borderRadius: 6,
  },
  docText: {
    flex: 1,
  },
  docTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  docSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
  progressContainer: {
    marginTop: 8,
  },
  filesSection: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.xl,
    padding: 20,
    ...neuShadow.raisedLight,
  },
  filesScrollContent: {
    flexGrow: 1,
  },
  filesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fileGridItem: {
    width: '33%',
    marginBottom: 16,
  },
  syncButtonContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  glassPhone: {
    width: PHONE_WIDTH * 0.85,
    height: PHONE_HEIGHT * 0.9,
    backgroundColor: colors.glassWhite,
    borderRadius: borderRadius.xxl,
    padding: 20,
    marginLeft: -60,
    marginTop: 30,
    zIndex: 1,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...neuShadow.glass,
  },
  recentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
    marginBottom: 20,
  },
  recentsText: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '500',
  },
  glassScrollContent: {
    flexGrow: 1,
    paddingBottom: 180,
  },
  glassGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  glassGridItem: {
    width: '31%',
  },
  wave: {
    position: 'absolute',
    bottom: 100,
    left: -20,
    right: -20,
    height: 60,
    backgroundColor: 'rgba(45,45,68,0.3)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  glassSyncContainer: {
    position: 'absolute',
    bottom: 140,
    left: '50%',
    transform: [{ translateX: -22 }],
  },
  glassSyncButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});

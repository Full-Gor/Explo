import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Vibration,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

import { colors, borderRadius } from '../theme/colors';
import { FileSystemService } from '../services/fileSystem';

const SETTINGS_KEYS = {
  DARK_MODE: '@settings_dark_mode',
  HAPTIC_FEEDBACK: '@settings_haptic',
  NOTIFICATIONS: '@settings_notifications',
  LANGUAGE: '@settings_language',
};

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  isLoading?: boolean;
}

function SettingRow({ icon, label, value, onPress, showArrow = true, isLoading }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress || isLoading}
    >
      <View style={styles.settingIcon}>
        <Feather name={icon as any} size={20} color={colors.accentGradientStart} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accentGradientStart} />
      ) : (
        <>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          {showArrow && onPress && (
            <Feather name="chevron-right" size={20} color={colors.textMuted} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

interface SettingSwitchRowProps {
  icon: string;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function SettingSwitchRow({ icon, label, value, onValueChange }: SettingSwitchRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Feather name={icon as any} size={20} color={colors.accentGradientStart} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.textMuted, true: colors.accentGradientStart }}
        thumbColor={colors.white}
      />
    </View>
  );
}

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [storageInfo, setStorageInfo] = useState<string>('Chargement...');
  const [cacheSize, setCacheSize] = useState<string>('Calcul...');
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Charger les paramètres sauvegardés
  useEffect(() => {
    loadSettings();
    loadStorageInfo();
    calculateCacheSize();
  }, []);

  const loadSettings = async () => {
    try {
      const [savedDarkMode, savedHaptic, savedNotifications, savedLanguage] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEYS.DARK_MODE),
        AsyncStorage.getItem(SETTINGS_KEYS.HAPTIC_FEEDBACK),
        AsyncStorage.getItem(SETTINGS_KEYS.NOTIFICATIONS),
        AsyncStorage.getItem(SETTINGS_KEYS.LANGUAGE),
      ]);

      if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');
      if (savedHaptic !== null) setHapticFeedback(savedHaptic === 'true');
      if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
      if (savedLanguage !== null) i18n.changeLanguage(savedLanguage);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const info = await FileSystemService.getStorageInfo();
      setStorageInfo(`${info.usedSpaceFormatted} / ${info.totalSpaceFormatted}`);
    } catch (error) {
      setStorageInfo('Non disponible');
    }
  };

  const calculateCacheSize = async () => {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const info = await FileSystem.getInfoAsync(cacheDir);
        if (info.exists && (info as any).size) {
          const sizeInMB = ((info as any).size / (1024 * 1024)).toFixed(1);
          setCacheSize(`${sizeInMB} MB`);
        } else {
          setCacheSize('0 MB');
        }
      }
    } catch (error) {
      setCacheSize('Non disponible');
    }
  };

  const handleLanguageChange = useCallback(() => {
    if (hapticFeedback) Vibration.vibrate(10);

    Alert.alert(
      'Choisir la langue',
      '',
      [
        { text: 'Français', onPress: () => changeLanguage('fr') },
        { text: 'English', onPress: () => changeLanguage('en') },
        { text: 'Español', onPress: () => changeLanguage('es') },
        { text: 'Русский', onPress: () => changeLanguage('ru') },
        { text: '中文', onPress: () => changeLanguage('zh') },
        { text: '日本語', onPress: () => changeLanguage('ja') },
        { text: 'العربية', onPress: () => changeLanguage('ar') },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  }, [hapticFeedback]);

  const changeLanguage = async (lang: string) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEYS.LANGUAGE, lang);
      i18n.changeLanguage(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const getLanguageName = (code: string): string => {
    const names: Record<string, string> = {
      fr: 'Français',
      en: 'English',
      es: 'Español',
      ru: 'Русский',
      zh: '中文',
      ja: '日本語',
      ar: 'العربية',
    };
    return names[code] || code;
  };

  const handleDarkModeChange = async (value: boolean) => {
    if (hapticFeedback) Vibration.vibrate(10);
    setDarkMode(value);
    try {
      await AsyncStorage.setItem(SETTINGS_KEYS.DARK_MODE, value.toString());
    } catch (error) {
      console.error('Error saving dark mode:', error);
    }
  };

  const handleHapticChange = async (value: boolean) => {
    if (value) Vibration.vibrate(10);
    setHapticFeedback(value);
    try {
      await AsyncStorage.setItem(SETTINGS_KEYS.HAPTIC_FEEDBACK, value.toString());
    } catch (error) {
      console.error('Error saving haptic setting:', error);
    }
  };

  const handleNotificationsChange = async (value: boolean) => {
    if (hapticFeedback) Vibration.vibrate(10);
    setNotifications(value);
    try {
      await AsyncStorage.setItem(SETTINGS_KEYS.NOTIFICATIONS, value.toString());
    } catch (error) {
      console.error('Error saving notifications setting:', error);
    }
  };

  const handleClearCache = async () => {
    if (hapticFeedback) Vibration.vibrate(10);

    Alert.alert(
      'Vider le cache',
      'Êtes-vous sûr de vouloir vider le cache de l\'application ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: async () => {
            setIsClearingCache(true);
            try {
              const cacheDir = FileSystem.cacheDirectory;
              if (cacheDir) {
                const files = await FileSystem.readDirectoryAsync(cacheDir);
                for (const file of files) {
                  await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
                }
              }
              setCacheSize('0 MB');
              Alert.alert('Succès', 'Le cache a été vidé');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Erreur', 'Impossible de vider le cache');
            } finally {
              setIsClearingCache(false);
            }
          },
        },
      ]
    );
  };

  const handleStorageDetails = () => {
    if (hapticFeedback) Vibration.vibrate(10);
    Alert.alert(
      'Stockage',
      `Espace utilisé: ${storageInfo}\n\nL'espace de stockage est géré par le système.`,
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPolicy = () => {
    if (hapticFeedback) Vibration.vibrate(10);
    Alert.alert(
      'Politique de confidentialité',
      'Cette application ne collecte aucune donnée personnelle. Tous vos fichiers restent sur votre appareil.',
      [{ text: 'OK' }]
    );
  };

  const handleTermsOfService = () => {
    if (hapticFeedback) Vibration.vibrate(10);
    Alert.alert(
      'Conditions d\'utilisation',
      'Cette application est fournie "telle quelle" sans aucune garantie. Utilisez-la à vos propres risques.',
      [{ text: 'OK' }]
    );
  };

  const handleAbout = () => {
    if (hapticFeedback) Vibration.vibrate(10);
    Alert.alert(
      'À propos de Explo',
      'Explo - Explorateur de fichiers\nVersion 1.0.0\n\nUne application simple et élégante pour gérer vos fichiers.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Feather name="settings" size={24} color={colors.white} />
        <Text style={styles.headerTitle}>{t('actions.settings')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Apparence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apparence</Text>
          <View style={styles.sectionContent}>
            <SettingSwitchRow
              icon="moon"
              label="Mode sombre"
              value={darkMode}
              onValueChange={handleDarkModeChange}
            />
            <SettingRow
              icon="globe"
              label="Langue"
              value={getLanguageName(i18n.language)}
              onPress={handleLanguageChange}
            />
          </View>
        </View>

        {/* Général */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Général</Text>
          <View style={styles.sectionContent}>
            <SettingSwitchRow
              icon="smartphone"
              label="Retour haptique"
              value={hapticFeedback}
              onValueChange={handleHapticChange}
            />
            <SettingSwitchRow
              icon="bell"
              label="Notifications"
              value={notifications}
              onValueChange={handleNotificationsChange}
            />
            <SettingRow
              icon="hard-drive"
              label="Stockage"
              value={storageInfo}
              onPress={handleStorageDetails}
            />
          </View>
        </View>

        {/* Gestion des fichiers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestion des fichiers</Text>
          <View style={styles.sectionContent}>
            <SettingRow
              icon="trash-2"
              label="Vider le cache"
              value={cacheSize}
              onPress={handleClearCache}
              isLoading={isClearingCache}
            />
          </View>
        </View>

        {/* À propos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <View style={styles.sectionContent}>
            <SettingRow
              icon="info"
              label="Version"
              value="1.0.0"
              onPress={handleAbout}
            />
            <SettingRow
              icon="shield"
              label="Politique de confidentialité"
              onPress={handlePrivacyPolicy}
            />
            <SettingRow
              icon="file-text"
              label="Conditions d'utilisation"
              onPress={handleTermsOfService}
            />
          </View>
        </View>
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
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.cardBg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '600',
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: colors.cardLight,
    marginHorizontal: 16,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    flex: 1,
    color: colors.textDark,
    fontSize: 15,
  },
  settingValue: {
    color: colors.textMuted,
    fontSize: 14,
    marginRight: 8,
  },
});

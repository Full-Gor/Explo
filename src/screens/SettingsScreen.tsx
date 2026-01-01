import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Vibration,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors, borderRadius } from '../theme/colors';

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

function SettingRow({ icon, label, value, onPress, showArrow = true }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        <Feather name={icon as any} size={20} color={colors.accentGradientStart} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {showArrow && onPress && (
        <Feather name="chevron-right" size={20} color={colors.textMuted} />
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

  const handleLanguageChange = useCallback(() => {
    Vibration.vibrate(10);
    // Cycle through languages for demo
    const languages = ['fr', 'en', 'es', 'ru', 'zh', 'ja', 'ar'];
    const currentIndex = languages.indexOf(i18n.language);
    const nextIndex = (currentIndex + 1) % languages.length;
    i18n.changeLanguage(languages[nextIndex]);
  }, [i18n]);

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

  const handleDarkModeChange = (value: boolean) => {
    Vibration.vibrate(10);
    setDarkMode(value);
  };

  const handleHapticChange = (value: boolean) => {
    if (value) Vibration.vibrate(10);
    setHapticFeedback(value);
  };

  const handleNotificationsChange = (value: boolean) => {
    Vibration.vibrate(10);
    setNotifications(value);
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
              value="40 GB / 100 GB"
              onPress={() => Vibration.vibrate(10)}
            />
          </View>
        </View>

        {/* Stockage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestion des fichiers</Text>
          <View style={styles.sectionContent}>
            <SettingRow
              icon="trash-2"
              label="Vider la corbeille"
              onPress={() => Vibration.vibrate(10)}
            />
            <SettingRow
              icon="refresh-cw"
              label="Synchroniser"
              onPress={() => Vibration.vibrate(10)}
            />
            <SettingRow
              icon="download-cloud"
              label="Fichiers hors ligne"
              onPress={() => Vibration.vibrate(10)}
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
              showArrow={false}
            />
            <SettingRow
              icon="shield"
              label="Politique de confidentialité"
              onPress={() => Vibration.vibrate(10)}
            />
            <SettingRow
              icon="file-text"
              label="Conditions d'utilisation"
              onPress={() => Vibration.vibrate(10)}
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
    paddingBottom: 100,
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

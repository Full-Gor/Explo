import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, borderRadius } from '../theme/colors';

interface Props {
  onSearch?: (query: string) => void;
  onVoiceSearch?: () => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, onVoiceSearch, placeholder }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (text: string) => {
    setQuery(text);
    onSearch?.(text);
  };

  const handleVoicePress = () => {
    Vibration.vibrate(10);
    onVoiceSearch?.();
  };

  return (
    <View style={[styles.container, isFocused && styles.focused]}>
      <Feather name="search" size={18} color={colors.textDim} />
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={handleChange}
        placeholder={placeholder || t('common.search')}
        placeholderTextColor={colors.textDim}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {onVoiceSearch && (
        <TouchableOpacity onPress={handleVoicePress} activeOpacity={0.7}>
          <Feather name="mic" size={18} color={colors.textDim} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  focused: {
    borderColor: colors.accentGradientStart,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
});

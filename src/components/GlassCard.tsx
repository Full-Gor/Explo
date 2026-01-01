import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, neuShadow, borderRadius } from '../theme/colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'heavy';
}

export function GlassCard({ children, style, intensity = 'medium' }: Props) {
  const getOpacity = () => {
    switch (intensity) {
      case 'light':
        return 0.15;
      case 'heavy':
        return 0.4;
      default:
        return 0.25;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: `rgba(255,255,255,${getOpacity()})`,
        },
        neuShadow.glass,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
});

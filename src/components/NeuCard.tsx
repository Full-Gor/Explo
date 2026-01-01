import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, neuShadow, borderRadius } from '../theme/colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'dark' | 'light' | 'raised';
}

export function NeuCard({ children, style, variant = 'dark' }: Props) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'light':
        return colors.cardLight;
      case 'raised':
        return colors.cardLightGradientStart;
      default:
        return colors.cardBg;
    }
  };

  const getShadow = () => {
    switch (variant) {
      case 'light':
      case 'raised':
        return neuShadow.raisedLight;
      default:
        return neuShadow.raised;
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: getBackgroundColor() },
        getShadow(),
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    padding: 16,
  },
});

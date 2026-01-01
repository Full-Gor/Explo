import { ViewStyle } from 'react-native';

export const colors = {
  // Background colors
  background: '#1a1a1f',
  backgroundLight: '#E8E4F0',
  backgroundGradientStart: '#E8E4F0',
  backgroundGradientMiddle: '#D4D0E0',
  backgroundGradientEnd: '#C8C4D8',

  // Card backgrounds
  cardBg: '#1e1e24',
  cardBgAlt: '#252530',
  cardBgDark: '#16161a',
  cardDarkGradientStart: '#2D2D44',
  cardDarkGradientEnd: '#1A1A2E',

  // Light cards
  cardLight: '#FAFAFA',
  cardLightGradientStart: '#FFFFFF',
  cardLightGradientEnd: '#F0F0F5',

  // Glass effect
  glassWhite: 'rgba(255,255,255,0.25)',
  glassBorder: 'rgba(255,255,255,0.4)',
  glassHighlight: 'rgba(255,255,255,0.4)',

  // Accent colors
  accent: '#4ade80',
  accentGradientStart: '#667EEA',
  accentGradientEnd: '#764BA2',

  // Text colors
  textPrimary: '#f8f8f8',
  textMuted: '#9ca3af',
  textDim: '#6b7280',
  textDark: '#374151',

  // File type colors
  folderOrange: '#F5A623',
  imageBlue: '#4A90E2',
  audioRed: '#E74C3C',
  audioPurple: '#9B59B6',
  chartPurple: '#667EEA',
  documentGray: '#4A4A6A',

  // Additional colors
  white: '#FFFFFF',
  black: '#000000',
  success: '#2ECC71',
  successDark: '#27AE60',
  dropboxBlue: '#0061FF',
  syncBlue: '#4A90E2',
};

export interface NeuShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const neuShadow = {
  raised: {
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  } as NeuShadowStyle,

  raisedLight: {
    shadowColor: colors.black,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  } as NeuShadowStyle,

  inset: {
    shadowColor: colors.black,
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  } as NeuShadowStyle,

  glass: {
    shadowColor: colors.black,
    shadowOffset: { width: 20, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 10,
  } as NeuShadowStyle,

  card: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 12,
  } as NeuShadowStyle,

  button: {
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  } as NeuShadowStyle,

  iconWrapper: {
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  } as NeuShadowStyle,
};

export const gradients = {
  background: [colors.backgroundGradientStart, colors.backgroundGradientMiddle, colors.backgroundGradientEnd],
  darkCard: [colors.cardDarkGradientStart, colors.cardDarkGradientEnd],
  lightCard: [colors.cardLightGradientStart, colors.cardLightGradientEnd],
  accent: [colors.accentGradientStart, colors.accentGradientEnd],
  progress: [colors.accentGradientStart, colors.accentGradientEnd],
};

export const borderRadius = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 32,
  xxl: 44,
  phone: 48,
};

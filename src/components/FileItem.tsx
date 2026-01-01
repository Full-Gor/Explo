import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Image,
} from 'react-native';
import { colors, neuShadow, borderRadius } from '../theme/colors';
import { FileIconType } from '../types';

interface Props {
  name: string;
  extension: string;
  icon: React.ReactNode;
  thumbnailUri?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: 'solid' | 'glass';
}

export function FileItem({
  name,
  extension,
  icon,
  thumbnailUri,
  onPress,
  onLongPress,
  variant = 'solid',
}: Props) {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Vibration.vibrate(10);
    onPress?.();
  };

  const handleLongPress = () => {
    Vibration.vibrate(50);
    onLongPress?.();
  };

  const isGlass = variant === 'glass';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.container,
          isGlass ? styles.glassContainer : styles.solidContainer,
          isPressed && (isGlass ? styles.glassPressed : styles.solidPressed),
        ]}
      >
        <View
          style={[
            styles.iconWrapper,
            isGlass ? styles.glassIconWrapper : styles.solidIconWrapper,
            isPressed && !isGlass && styles.iconPressed,
            thumbnailUri && styles.thumbnailWrapper,
          ]}
        >
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            icon
          )}
        </View>
        <Text
          style={[styles.name, isGlass && styles.glassName]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text style={[styles.extension, isGlass && styles.glassExtension]}>
          {extension}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 12,
    borderRadius: borderRadius.md,
    gap: 8,
  },
  solidContainer: {
    backgroundColor: 'transparent',
  },
  glassContainer: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    padding: 16,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  solidPressed: {
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
  },
  glassPressed: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    transform: [{ translateY: -3 }, { scale: 1.02 }],
  },
  iconWrapper: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  solidIconWrapper: {
    backgroundColor: colors.cardLightGradientStart,
    ...neuShadow.iconWrapper,
  },
  glassIconWrapper: {
    width: 48,
    height: 48,
    backgroundColor: 'transparent',
  },
  iconPressed: {
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    transform: [{ scale: 1.05 }],
  },
  thumbnailWrapper: {
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textDark,
    textAlign: 'center',
  },
  glassName: {
    fontSize: 11,
  },
  extension: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  glassExtension: {
    fontSize: 9,
  },
});

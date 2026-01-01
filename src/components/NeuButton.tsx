import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
  Vibration,
} from 'react-native';
import { colors, neuShadow, borderRadius } from '../theme/colors';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'circle' | 'rounded' | 'square';
  size?: number;
  haptic?: boolean;
}

export function NeuButton({
  children,
  onPress,
  style,
  variant = 'rounded',
  size = 48,
  haptic = true,
}: Props) {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const getBorderRadius = () => {
    switch (variant) {
      case 'circle':
        return size / 2;
      case 'square':
        return borderRadius.sm;
      default:
        return borderRadius.md;
    }
  };

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
    if (haptic) {
      Vibration.vibrate(10);
    }
    onPress?.();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: getBorderRadius(),
          },
          isPressed ? styles.pressed : neuShadow.button,
          style,
        ]}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.cardLightGradientStart,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    shadowColor: colors.black,
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
});

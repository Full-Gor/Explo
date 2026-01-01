import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, gradients } from '../theme/colors';

interface Props {
  progress: number; // 0 to 100
  label?: string;
  showLabel?: boolean;
}

export function ProgressBar({ progress, label, showLabel = true }: Props) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View style={[styles.fillContainer, { width }]}>
          <LinearGradient
            colors={gradients.progress as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fill}
          />
        </Animated.View>
      </View>
      {showLabel && label && (
        <Text style={styles.label}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fillContainer: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
});

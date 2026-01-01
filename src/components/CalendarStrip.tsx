import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, borderRadius } from '../theme/colors';
import { CalendarDay } from '../types';

interface Props {
  days: CalendarDay[];
  onDayPress?: (day: CalendarDay, index: number) => void;
}

export function CalendarStrip({ days, onDayPress }: Props) {
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  const handlePress = (day: CalendarDay, index: number) => {
    Vibration.vibrate(10);
    onDayPress?.(day, index);
  };

  return (
    <LinearGradient
      colors={gradients.darkCard as [string, string]}
      style={styles.container}
    >
      <View style={styles.inner}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={() => handlePress(day, index)}
            onPressIn={() => setPressedIndex(index)}
            onPressOut={() => setPressedIndex(null)}
            style={[
              styles.dayItem,
              day.isActive && styles.dayItemActive,
              pressedIndex === index && styles.dayItemPressed,
            ]}
          >
            <Text style={styles.dayNumber}>{day.number}</Text>
            {day.label && <Text style={styles.dayLabel}>{day.label}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    paddingHorizontal: 16,
    paddingBottom: 20,
    justifyContent: 'flex-end',
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dayItem: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
  },
  dayItemActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  dayItemPressed: {
    transform: [{ scale: 0.95 }],
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  dayLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const sizeConfig = {
    sm: { container: 28, fontSize: 12, icon: 14 },
    md: { container: 36, fontSize: 14, icon: 18 },
    lg: { container: 48, fontSize: 18, icon: 24 },
  };
  const config = sizeConfig[size];

  return (
    <View style={[styles.container, { width: config.container, height: config.container }]}>
      <MaterialCommunityIcons name="fire" size={config.icon} color={colors.textOnPrimary} />
      <Text style={[styles.text, { fontSize: config.fontSize }]}>{streak}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: colors.accentWarm,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.xs,
  },
  text: { color: colors.textOnPrimary, fontWeight: '700' },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import type { Habit } from '@/types';
import { CheckInAnimation } from './CheckInAnimation';

interface CheckInCardProps {
  habit: Habit;
  isChecked: boolean;
  streak: number;
  onToggle: () => void;
}

export function CheckInCard({ habit, isChecked, streak, onToggle }: CheckInCardProps) {
  const scale = useSharedValue(1);
  const [showAnimation, setShowAnimation] = useState(false);

  const handlePress = () => {
    if (!isChecked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAnimation(true);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    onToggle();
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={cardStyle}>
        <TouchableOpacity
          style={[styles.card, isChecked && styles.cardChecked]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: habit.color + '30' }]}>
            <MaterialCommunityIcons name={habit.icon as any} size={28} color={habit.color} />
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{habit.title}</Text>
              <View style={[styles.modeTag, habit.mode === 'record' ? styles.modeTagRecord : styles.modeTagRequired]}>
                <Text style={[styles.modeTagText, habit.mode === 'record' ? styles.modeTagTextRecord : styles.modeTagTextRequired]}>
                  {habit.mode === 'record' ? '记录' : '必做'}
                </Text>
              </View>
            </View>
            {streak > 0 && (
              <View style={styles.streakRow}>
                <MaterialCommunityIcons name="fire" size={14} color={colors.accentWarm} />
                <Text style={styles.streakText}>连续 {streak} 天</Text>
              </View>
            )}
          </View>

          <View style={[styles.checkCircle, isChecked && styles.checkCircleChecked]}>
            {isChecked && <MaterialCommunityIcons name="check" size={20} color={colors.textOnPrimary} />}
          </View>
        </TouchableOpacity>
      </Animated.View>
      <CheckInAnimation visible={showAnimation} onComplete={() => setShowAnimation(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardChecked: {
    backgroundColor: colors.accentMint + '30',
    borderColor: colors.accentMint,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, marginLeft: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.body1, color: colors.textPrimary, fontWeight: '600', flexShrink: 1 },
  modeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
    flexShrink: 0,
  },
  modeTagRequired: { backgroundColor: colors.accentWarm + '20' },
  modeTagRecord: { backgroundColor: colors.accentLavender + '20' },
  modeTagText: { ...typography.caption, fontSize: 11, fontWeight: '600' },
  modeTagTextRequired: { color: colors.accentWarm },
  modeTagTextRecord: { color: colors.accentLavender },
  streakRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  streakText: { ...typography.caption, color: colors.accentWarm, marginLeft: spacing.xs, fontWeight: '500' },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
});

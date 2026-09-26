import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Mascot } from './Mascot';
import { colors, typography, spacing } from '@/theme';

interface EmptyStateProps {
  message: string;
  subMessage?: string;
}

export function EmptyState({ message, subMessage }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Mascot size={100} expression="sleepy" />
      <Text style={styles.message}>{message}</Text>
      {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl },
  message: { ...typography.h3, color: colors.textSecondary, marginTop: spacing.lg },
  subMessage: { ...typography.body2, color: colors.textHint, marginTop: spacing.xs },
});

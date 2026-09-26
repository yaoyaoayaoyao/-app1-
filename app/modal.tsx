import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { Mascot } from '@/components/Mascot';
import { colors, typography, spacing } from '@/theme';

export default function ModalScreen() {
  return (
    <ScreenWrapper gradient="sky" safeArea={false}>
      {/* 顶部栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>关于</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 内容 */}
      <View style={styles.content}>
        <Mascot size={140} expression="happy" />

        <Text style={styles.appName}>玉桂狗日记</Text>
        <Text style={styles.version}>版本 1.0.0</Text>

        <View style={styles.card}>
          <Text style={styles.description}>
            一个可爱的日常打卡和便签 App{'\n'}
            记录每一天的美好时光{'\n'}
            让玉桂狗陪伴你成长 ~
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color={colors.accentMint} />
            <Text style={styles.featureText}>每日习惯打卡</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="note-text" size={20} color={colors.accentWarm} />
            <Text style={styles.featureText}>彩色便签记录</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="chart-line" size={20} color={colors.primary} />
            <Text style={styles.featureText}>数据统计总结</Text>
          </View>
        </View>

        <Text style={styles.madeWith}>
          Made with <MaterialCommunityIcons name="heart" size={14} color={colors.accentWarm} /> 玉桂狗
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  topTitle: { ...typography.h3, color: colors.textPrimary },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  appName: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  version: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.xl,
    width: '100%',
  },
  description: {
    ...typography.body1,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    width: '100%',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  featureText: {
    ...typography.body1,
    color: colors.textPrimary,
  },
  madeWith: {
    ...typography.caption,
    color: colors.textHint,
    marginTop: 'auto',
    marginBottom: spacing.xl,
  },
});

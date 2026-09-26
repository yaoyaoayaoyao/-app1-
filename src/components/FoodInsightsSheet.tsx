import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NutritionRing } from './NutritionRing';
import { useFoodStore } from '@/stores/food.store';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';

interface FoodInsightsSheetProps {
  visible: boolean;
  onClose: () => void;
  initialPeriod?: 'week' | 'month';
}

/**
 * 饮食统计弹层
 * 周/月切换
 * 显示: 记录天数/总餐次/日均热量/连续天数
 * 三大营养素总占比
 * top3食物
 * 智能点评文案
 */
export function FoodInsightsSheet({
  visible,
  onClose,
  initialPeriod = 'week',
}: FoodInsightsSheetProps) {
  const [period, setPeriod] = useState<'week' | 'month'>(initialPeriod);
  const getInsights = useFoodStore((s) => s.getInsights);

  const insights = useMemo(() => getInsights(period), [getInsights, period]);

  const mealCountList = [
    { label: '早餐', emoji: '🌅', count: insights.mealCounts.breakfast, color: colors.accentLemon },
    { label: '午餐', emoji: '☀️', count: insights.mealCounts.lunch, color: colors.primaryLight },
    { label: '晚餐', emoji: '🌙', count: insights.mealCounts.dinner, color: colors.accentLavender },
    { label: '加餐', emoji: '🍪', count: insights.mealCounts.snack, color: colors.accentWarm },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* 顶部栏 */}
          <View style={styles.topBar}>
            <Text style={styles.title}>饮食小结</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* 拖拽条 */}
          <View style={styles.handleBar} />

          {/* 周/月切换 */}
          <View style={styles.periodSwitch}>
            {(['week', 'month'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                onPress={() => setPeriod(p)}
                activeOpacity={0.7}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                  {p === 'week' ? '本周' : '本月'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 智能点评 headline */}
            <View style={[styles.card, styles.headlineCard]}>
              <Text style={styles.headlineEmoji}>📊</Text>
              <Text style={styles.headlineText}>{insights.headline}</Text>
            </View>

            {/* 统计数据网格 */}
            <View style={styles.statGrid}>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{insights.recordedDays}</Text>
                <Text style={styles.statLabel}>记录天数</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{insights.totalMeals}</Text>
                <Text style={styles.statLabel}>总餐次</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{insights.avgKcal}</Text>
                <Text style={styles.statLabel}>日均热量</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{insights.streak}</Text>
                <Text style={styles.statLabel}>连续天数</Text>
              </View>
            </View>

            {/* 三大营养素总占比 */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="chart-donut" size={20} color={colors.primary} />
                <Text style={styles.cardTitle}>营养素总占比</Text>
              </View>
              <View style={styles.ringWrap}>
                <NutritionRing
                  carbs={insights.carbsKcal / 4}
                  fat={insights.fatKcal / 9}
                  protein={insights.proteinKcal / 4}
                  totalKcal={insights.totalKcal}
                  size={200}
                />
              </View>
            </View>

            {/* 餐别计数 */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={colors.accentWarm} />
                <Text style={styles.cardTitle}>餐别分布</Text>
              </View>
              <View style={styles.mealBarRow}>
                {mealCountList.map((m) => {
                  const maxCount = Math.max(...mealCountList.map((x) => x.count), 1);
                  const pct = (m.count / maxCount) * 100;
                  return (
                    <View key={m.label} style={styles.mealBarItem}>
                      <Text style={styles.mealBarEmoji}>{m.emoji}</Text>
                      <View style={styles.mealBarTrack}>
                        <View style={[styles.mealBarFill, { width: `${pct}%`, backgroundColor: m.color }]} />
                      </View>
                      <Text style={styles.mealBarCount}>{m.count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Top3 食物 */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="food-variant" size={20} color={colors.accentMint} />
                <Text style={styles.cardTitle}>常吃食物 Top 3</Text>
              </View>
              {insights.topFoods.length > 0 ? (
                insights.topFoods.map((food, i) => (
                  <View key={food.name} style={styles.topFoodRow}>
                    <View style={[styles.topFoodRank, { backgroundColor: getRankColor(i) }]}>
                      <Text style={styles.topFoodRankText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.topFoodName}>{food.name}</Text>
                    <Text style={styles.topFoodCount}>{food.count}次</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>还没有食物数据~</Text>
              )}
            </View>

            {/* 智能点评 tips */}
            <View style={[styles.card, styles.tipsCard]}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.warning} />
                <Text style={styles.cardTitle}>玉桂狗小贴士</Text>
              </View>
              {insights.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function getRankColor(index: number): string {
  return [colors.accentWarm, colors.accentMint, colors.accentLavender][index] || colors.primaryLight;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
    ...shadows.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleBar: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },

  // 周/月切换
  periodSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.pill,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  periodText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  periodTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // headline 卡片
  headlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight + '50',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headlineEmoji: {
    fontSize: 24,
  },
  headlineText: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },

  // 统计网格
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCell: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statNumber: {
    ...typography.h1,
    fontSize: 30,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // 通用卡片
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  ringWrap: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },

  // 餐别分布
  mealBarRow: {
    gap: spacing.sm,
  },
  mealBarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealBarEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  mealBarTrack: {
    flex: 1,
    height: 16,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mealBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  mealBarCount: {
    ...typography.body2,
    color: colors.textPrimary,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },

  // Top3 食物
  topFoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  topFoodRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topFoodRankText: {
    ...typography.body2,
    color: colors.textOnPrimary,
    fontWeight: '800',
  },
  topFoodName: {
    ...typography.body1,
    color: colors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  topFoodCount: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  emptyText: {
    ...typography.body2,
    color: colors.textHint,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },

  // tips
  tipsCard: {
    backgroundColor: colors.accentLemon + '30',
  },
  tipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipBullet: {
    ...typography.body2,
    color: colors.warning,
    fontWeight: '700',
  },
  tipText: {
    ...typography.body2,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },

  bottomSpacer: {
    height: 20,
  },
});

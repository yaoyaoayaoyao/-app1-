import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { Mascot } from '@/components/Mascot';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { UpdateBanner } from '@/components/UpdateBanner';
import { useAuthStore } from '@/stores/auth.store';
import { useCheckInStore } from '@/stores/checkin.store';
import { useNotesStore } from '@/stores/notes.store';
import { useMoodStore } from '@/stores/mood.store';
import { useFoodStore, calcKcal, MEAL_META } from '@/stores/food.store';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { getTodayString, getWeekRange } from '@/utils/date';
import { getMoodInfo, getMoodIcon } from '@/components/MoodPicker';

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const habits = useCheckInStore((s) => s.habits.filter((h) => !h.archived));
  const checkIns = useCheckInStore((s) => s.checkIns);
  const notes = useNotesStore((s) => s.notes);
  const todayMood = useMoodStore((s) => s.getTodayEntry());
  const customIcons = useMoodStore((s) => s.customIcons);
  const checkInLoading = useCheckInStore((s) => s.loading);
  const notesLoading = useNotesStore((s) => s.loading);
  const foodEntries = useFoodStore((s) => s.entries);

  const [storesReady, setStoresReady] = useState(false);

  // 模拟初始化（数据已通过 persist 自动恢复）
  useEffect(() => {
    const timer = setTimeout(() => setStoresReady(true), 100);
    return () => {
      clearTimeout(timer);
      setStoresReady(false);
    };
  }, []);

  // === 今日打卡 ===
  const todayCheckIns = useMemo(() => {
    const today = getTodayString();
    return checkIns.filter((c) => c.date === today && c.completed);
  }, [checkIns]);

  // === 打卡进度计算（按必做 / 记录 拆分） ===
  const doneHabitIds = useMemo(() => new Set(todayCheckIns.map((c) => c.habitId)), [todayCheckIns]);
  const requiredHabits = habits.filter((h) => h.mode !== 'record');
  const recordHabits = habits.filter((h) => h.mode === 'record');
  const requiredTotal = requiredHabits.length;
  const requiredDone = requiredHabits.filter((h) => doneHabitIds.has(h.id)).length;
  const requiredProgress = requiredTotal > 0 ? (requiredDone / requiredTotal) * 100 : 0;
  const allRequiredDone = requiredTotal > 0 && requiredDone >= requiredTotal;
  const recordTotal = recordHabits.length;
  const recordDone = recordHabits.filter((h) => doneHabitIds.has(h.id)).length;

  // === 便签统计 ===
  const todayNoteCount = useMemo(() => {
    const today = getTodayString();
    return notes.filter((n) => {
      const noteDate = format(new Date(n.createdAt), 'yyyy-MM-dd');
      return noteDate === today;
    }).length;
  }, [notes]);

  // === 今日饮食摘要 ===
  const todayFoodSummary = useMemo(() => {
    const today = getTodayString();
    const todayEntries = foodEntries.filter((e) => e.date === today);
    const mealCount = todayEntries.length;
    const totalKcal = todayEntries.reduce((sum, e) => sum + calcKcal(e), 0);
    return { mealCount, totalKcal };
  }, [foodEntries]);

  // === 本周打卡统计 ===
  const weekInfo = useMemo(() => {
    const [weekStart, weekEnd] = getWeekRange(getTodayString());
    const startDate = new Date(weekStart);
    const today = new Date(getTodayString());
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalWeekDays = 7;
    return {
      weekStart,
      weekEnd,
      daysPassed: Math.min(daysPassed, totalWeekDays),
      totalWeekDays,
    };
  }, []);

  // === 玉桂狗表情 ===
  const mascotExpression = allRequiredDone ? 'excited' : 'happy';

  // === 今日日期格式化 ===
  const todayDateStr = useMemo(() => {
    return format(new Date(), 'M月d日 EEEE', { locale: zhCN });
  }, []);

  // === 加载状态 ===
  const isLoading = !storesReady || (checkInLoading && habits.length === 0);

  // === 生成本周7天柱状图数据 ===
  const weekBars = useMemo(() => {
    const bars = [];
    for (let i = 0; i < 7; i++) {
      const isPastOrToday = i < weekInfo.daysPassed;
      const isToday = i === weekInfo.daysPassed - 1;
      bars.push({ day: i, isPastOrToday, isToday });
    }
    return bars;
  }, [weekInfo.daysPassed]);

  return (
    <ScreenWrapper gradient="sky">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* === OTA 更新横幅 === */}
        <UpdateBanner />

        {/* === 问候区 === */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
            <Text style={styles.greetingText}>你好，{user?.displayName || '玉桂狗'}！</Text>
            <Text style={styles.dateText}>{todayDateStr}</Text>
          </View>
          <View style={styles.greetingRight}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="cog-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Mascot size={70} expression={mascotExpression} animated={true} />
          </View>
        </View>

        {/* === 今日打卡概览卡片（大卡片） === */}
        <TouchableOpacity
          style={[styles.card, styles.cardShadow]}
          onPress={() => router.push('/checkin')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.accentWarm + '30' }]}>
              <MaterialCommunityIcons name="check-circle" size={24} color={colors.accentWarm} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>今日打卡</Text>
              <Text style={styles.cardSubtitle}>
                {allRequiredDone ? '必做全部完成啦！' : '继续加油哦~'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressNumbers}>
              <View style={styles.progressChipRow}>
                <MaterialCommunityIcons name="check-decagram" size={16} color={colors.accentWarm} />
                <Text style={styles.progressChipLabel}>必做</Text>
                <Text style={styles.progressCount}>
                  <Text style={styles.progressCountDone}>{requiredDone}</Text>
                  <Text style={styles.progressCountTotal}> / {requiredTotal}</Text>
                </Text>
              </View>
              <Text style={styles.progressPercent}>{Math.round(requiredProgress)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${requiredProgress}%`,
                    backgroundColor: allRequiredDone ? colors.success : colors.primary,
                  },
                ]}
              />
            </View>
            {allRequiredDone && (
              <Text style={styles.celebrateText}>🎉 必做全部完成，玉桂狗为你开心~</Text>
            )}
            {recordTotal > 0 && (
              <View style={styles.recordRow}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={15} color={colors.accentLavender} />
                <Text style={[styles.progressChipLabel, { color: colors.accentLavender }]}>记录</Text>
                <Text style={styles.recordCount}>
                  {recordDone} / {recordTotal}
                </Text>
                <Text style={styles.recordHint}>今天有没有干</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* === 今日饮食摘要卡片 === */}
        <TouchableOpacity
          style={[styles.card, styles.cardShadow]}
          onPress={() => router.push('/(tabs)/food' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.primaryLight + '50' }]}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={24} color={colors.primaryDark} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>今日饮食</Text>
              <Text style={styles.cardSubtitle}>
                {todayFoodSummary.mealCount > 0
                  ? `${todayFoodSummary.mealCount}餐 · ${todayFoodSummary.totalKcal}kcal`
                  : '还没有记录哦~'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
          </View>
        </TouchableOpacity>

        {/* === 两列并排小卡片 === */}
        <View style={styles.twoColRow}>
          {/* 便签概览（小卡片） */}
          <TouchableOpacity
            style={[styles.card, styles.cardShadow, styles.smallCard]}
            onPress={() => router.push('/notes')}
            activeOpacity={0.8}
          >
            <View style={[styles.smallCardIcon, { backgroundColor: colors.accentMint + '30' }]}>
              <MaterialCommunityIcons name="note-text" size={20} color={colors.accentMint} />
            </View>
            <Text style={styles.smallCardTitle}>我的便签</Text>
            <View style={styles.smallCardStat}>
              <Text style={styles.smallCardNumber}>{notes.length}</Text>
              <Text style={styles.smallCardLabel}>便签总数</Text>
            </View>
            <Text style={styles.smallCardSubStat}>
              今日新增 <Text style={styles.smallCardSubStatNum}>{todayNoteCount}</Text>
            </Text>
          </TouchableOpacity>

          {/* 今日心情（小卡片） */}
          <TouchableOpacity
            style={[styles.card, styles.cardShadow, styles.smallCard]}
            onPress={() => router.push('/mood-history' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.smallCardIcon, { backgroundColor: (todayMood ? getMoodInfo(todayMood.mood).color : colors.accentWarm) + '20' }]}>
              {todayMood
                ? getMoodIcon(todayMood.mood, getMoodInfo(todayMood.mood).color, 32, customIcons[todayMood.mood])
                : <MaterialCommunityIcons name="emoticon-outline" size={24} color={colors.accentWarm} />}
            </View>
            <Text style={styles.smallCardTitle}>今日心情</Text>
            <View style={styles.smallCardStat}>
              <Text style={styles.smallCardMoodLabel}>
                {todayMood ? getMoodInfo(todayMood.mood).label : '去记录'}
              </Text>
            </View>
            <Text style={styles.smallCardSubStat}>
              {todayMood ? '点击查看' : '记录一下吧~'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* === 本周打卡概览卡片 === */}
        <TouchableOpacity
          style={[styles.card, styles.cardShadow, styles.weekCard]}
          onPress={() => router.push('/checkin')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.primary + '30' }]}>
              <MaterialCommunityIcons name="calendar-week" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>本周打卡</Text>
              <Text style={styles.cardSubtitle}>
                共 {requiredTotal} 个必做 · {recordTotal} 个记录 · 第 {weekInfo.daysPassed}/7 天
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
          </View>

          {/* 本周7天柱状图 */}
          <View style={styles.weekBarsRow}>
            {weekBars.map((bar) => (
              <View key={bar.day} style={styles.weekBarColumn}>
                <View style={styles.weekBarTrack}>
              <View
                style={[
                  styles.weekBarFill,
                  {
                    backgroundColor: bar.isToday
                      ? colors.primary
                      : bar.isPastOrToday
                      ? colors.primaryLight
                      : colors.surfaceVariant,
                    height: bar.isToday
                      ? `${Math.max(requiredProgress, 20)}%`
                      : bar.isPastOrToday
                      ? '60%'
                      : '0%',
                  },
                ]}
              />
                </View>
                <Text
                  style={[
                    styles.weekBarLabel,
                    bar.isToday && styles.weekBarLabelToday,
                  ]}
                >
                  {['一', '二', '三', '四', '五', '六', '日'][bar.day]}
                </Text>
              </View>
            ))}
          </View>

          {/* 本周进度文字 */}
          <View style={styles.weekProgressTextRow}>
            <Text style={styles.weekProgressHint}>
              {allRequiredDone
                ? '🌟 今日必做全部完成，继续保持！'
                : requiredTotal === 0 && recordTotal === 0
                ? '添加习惯开始打卡吧~'
                : `今日必做已完成 ${requiredDone}/${requiredTotal}` +
                  (recordTotal > 0 ? ` · 记录 ${recordDone}/${recordTotal}` : '')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* === 快捷操作区 === */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>快捷操作</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.accentWarm }]}
              onPress={() => router.push('/mood-history' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickActionEmoji}>💗</Text>
              <Text style={styles.quickActionLabel}>心情</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/food-edit' as any)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="silverware-fork-knife" size={28} color={colors.textOnPrimary} />
              <Text style={styles.quickActionLabel}>记一餐</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.accentMint }]}
              onPress={() => router.push('/note-edit')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="pencil"
                size={28}
                color={colors.textOnPrimary}
              />
              <Text style={styles.quickActionLabel}>写便签</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.accentLavender }]}
              onPress={() => router.push('/journal-edit' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickActionEmoji}>📔</Text>
              <Text style={styles.quickActionLabel}>写手账</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#9B7ED8' }]}
              onPress={() => router.push('/summary' as any)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="robot-happy" size={28} color="#FFFFFF" />
              <Text style={styles.quickActionLabel}>AI总结</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 底部间距（给 TabBar 留空间） */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="玉桂狗正在加载..." />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // === 问候区 ===
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  greetingLeft: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  greetingText: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  dateText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  greetingRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface + '90',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // === 通用卡片 ===
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardShadow: {
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardIconOutline: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // === 打卡进度 ===
  progressSection: {
    marginTop: spacing.xs,
  },
  progressNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  progressCount: {
    ...typography.h1,
  },
  progressCountDone: {
    color: colors.primary,
    fontWeight: '800',
  },
  progressCountTotal: {
    color: colors.textHint,
    fontSize: 18,
    fontWeight: '500',
  },
  progressPercent: {
    ...typography.h3,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressChipLabel: {
    ...typography.body2,
    color: colors.accentWarm,
    fontWeight: '600',
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  recordCount: {
    ...typography.body2,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  recordHint: {
    ...typography.caption,
    color: colors.textHint,
    marginLeft: spacing.xs,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  celebrateText: {
    ...typography.body2,
    color: colors.success,
    marginTop: spacing.sm,
    fontWeight: '500',
  },

  // === 两列卡片行 ===
  twoColRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  smallCard: {
    flex: 1,
    padding: spacing.md,
    marginBottom: 0,
    alignItems: 'center',
  },
  smallCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  smallCardTitle: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  smallCardStat: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  smallCardNumber: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  smallCardLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  smallCardSubStat: {
    ...typography.caption,
    color: colors.textHint,
    marginTop: spacing.xs,
  },
  smallCardSubStatNum: {
    color: colors.accentMint,
    fontWeight: '600',
  },
  moodDotIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  smallCardMoodLabel: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
  },

  // === 本周打卡卡片 ===
  weekCard: {
    marginBottom: spacing.xl,
  },
  weekBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
  weekBarColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  weekBarTrack: {
    width: 20,
    height: 60,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weekBarFill: {
    width: '100%',
    borderRadius: 10,
    minHeight: 0,
  },
  weekBarLabel: {
    ...typography.caption,
    color: colors.textHint,
    marginTop: spacing.xs,
    fontSize: 11,
  },
  weekBarLabelToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  weekProgressTextRow: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  weekProgressHint: {
    ...typography.body2,
    color: colors.textSecondary,
  },

  // === 快捷操作区 ===
  quickActionsSection: {
    marginTop: spacing.sm,
  },
  quickActionsTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    paddingLeft: spacing.xs,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  quickActionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  quickActionLabel: {
    ...typography.caption,
    color: colors.textOnPrimary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  quickActionEmoji: {
    fontSize: 26,
  },

  // === 底部间距 ===
  bottomSpacer: {
    height: 100,
  },
});

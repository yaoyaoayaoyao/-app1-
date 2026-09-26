import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { useMoodStore } from '@/stores/mood.store';
import { getMoodInfo } from './MoodPicker';
import type { MoodType, MoodEntry } from '@/types';
import { getTodayString } from '@/utils/date';

interface MoodCalendarProps {
  /** 是否为紧凑模式（用于profile预览） */
  compact?: boolean;
  /** 点击某天的回调 */
  onDayPress?: (date: string, entry: MoodEntry | null) => void;
  /** 初始显示的年月，默认当前月 */
  initialYear?: number;
  initialMonth?: number;
}

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function MoodCalendar({ compact = false, onDayPress, initialYear, initialMonth }: MoodCalendarProps) {
  const entries = useMoodStore((s) => s.entries);

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(initialYear ?? now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialMonth ?? now.getMonth() + 1);

  const today = getTodayString();

  // 构建日历数据
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const startWeekday = firstDay.getDay(); // 0-6, 周日为0
    const daysInMonth = lastDay.getDate();

    const days: { date: string; day: number; isCurrentMonth: boolean; entry: MoodEntry | null }[] = [];

    // 上个月末尾的几天
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entry = entries.find((e) => e.date === dateStr) || null;
      days.push({ date: dateStr, day, isCurrentMonth: false, entry });
    }

    // 当月
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entry = entries.find((e) => e.date === dateStr) || null;
      days.push({ date: dateStr, day, isCurrentMonth: true, entry });
    }

    // 补全最后一行
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let day = 1; day <= remaining; day++) {
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
        const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = entries.find((e) => e.date === dateStr) || null;
        days.push({ date: dateStr, day, isCurrentMonth: false, entry });
      }
    }

    return days;
  }, [currentYear, currentMonth, entries]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 本月心情统计
  const monthStats = useMemo(() => {
    const stats: Record<MoodType, number> = {
      happy: 0, calm: 0, tired: 0, sad: 0, excited: 0, angry: 0,
    };
    entries.forEach((e) => {
      const [y, m] = e.date.split('-').map(Number);
      if (y === currentYear && m === currentMonth) {
        stats[e.mood]++;
      }
    });
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    return { stats, total };
  }, [entries, currentYear, currentMonth]);

  return (
    <View style={compact ? styles.containerCompact : styles.container}>
      {/* 月份导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{currentYear}年{currentMonth}月</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* 星期头 */}
      <View style={styles.weekHeader}>
        {WEEK_DAYS.map((day) => (
          <Text key={day} style={compact ? styles.weekDaySmall : styles.weekDay}>{day}</Text>
        ))}
      </View>

      {/* 日期网格 */}
      <View style={styles.grid}>
        {calendarDays.map((item, index) => {
          const isToday = item.date === today;
          const moodInfo = item.entry ? getMoodInfo(item.entry.mood) : null;

          return (
            <TouchableOpacity
              key={`${item.date}-${index}`}
              style={[
                compact ? styles.dayCellSmall : styles.dayCell,
                !item.isCurrentMonth && styles.dayCellOtherMonth,
                isToday && styles.dayCellToday,
              ]}
              onPress={() => item.isCurrentMonth && onDayPress?.(item.date, item.entry)}
              activeOpacity={0.7}
              disabled={!item.isCurrentMonth || !onDayPress}
            >
              {moodInfo ? (
                <View style={[
                  compact ? styles.moodDotSmall : styles.moodDot,
                  { backgroundColor: moodInfo.color },
                ]} />
              ) : (
                <Text
                  style={[
                    compact ? styles.dayNumberSmall : styles.dayNumber,
                    !item.isCurrentMonth && styles.dayNumberOtherMonth,
                    isToday && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  {item.day}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 本月统计（非紧凑模式） */}
      {!compact && monthStats.total > 0 && (
        <View style={styles.statsRow}>
          {Object.entries(monthStats.stats)
            .filter(([, count]) => count > 0)
            .map(([mood, count]) => {
              const info = getMoodInfo(mood as MoodType);
              const percent = monthStats.total > 0 ? Math.round((count / monthStats.total) * 100) : 0;
              return (
                <View key={mood} style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: info.color }]} />
                <Text style={styles.statCount}>{count}天</Text>
                <Text style={styles.statPercent}>{percent}%</Text>
              </View>
              );
            })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  containerCompact: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  navBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textHint,
    fontWeight: '500',
    paddingVertical: spacing.xs,
  },
  weekDaySmall: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    color: colors.textHint,
    fontWeight: '500',
    paddingVertical: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  dayCellSmall: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayNumber: {
    ...typography.body2,
    color: colors.textPrimary,
  },
  dayNumberSmall: {
    fontSize: 11,
    color: colors.textPrimary,
  },
  dayNumberOtherMonth: {
    color: colors.textHint,
  },
  moodDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  moodDotSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 48,
  },
  statDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginBottom: 4,
  },
  statCount: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  statPercent: {
    fontSize: 10,
    color: colors.textHint,
  },
});

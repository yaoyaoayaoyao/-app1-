import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { NOTE_TAG_LABELS } from '@/utils/constants';
import { getTodayString, formatDate } from '@/utils/date';
import type { Note, JournalEntry, FoodEntry, NoteTag } from '@/types';
import { getDayDetail } from '@/services/journal-summary.service';
import { DayDetailSheet } from './DayDetailSheet';

const SCREEN_WIDTH = Dimensions.get('window').width;
const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];

interface JournalCalendarProps {
  notes: Note[];
  journals: JournalEntry[];
  foodEntries: FoodEntry[];
  moodEntries: import('@/types').MoodEntry[];
  onAddRecord?: (date: string) => void;
  onOpenJournal?: (journal: JournalEntry) => void;
  onOpenNote?: (note: Note) => void;
}

/** 每天的数据：照片 + 分类色点 */
interface DayCellData {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  photo: string | null; // 第一张照片
  dots: string[]; // 分类色点
  hasRecord: boolean;
  recordCount: number;
}

/** 将时间戳转为日期字符串 */
function tsToDate(ts: number): string {
  return formatDate(new Date(ts));
}

/** 获取便签分类色 */
function getNoteTagColor(tag: NoteTag): string {
  const map: Record<NoteTag, string> = {
    todo: colors.accentLemon,
    idea: colors.accentWarm,
    diary: colors.accentMint,
    reminder: colors.accentLavender,
    plain: colors.primaryLight,
  };
  return map[tag] || colors.primaryLight;
}

export function JournalCalendar({
  notes,
  journals,
  foodEntries,
  moodEntries,
  onAddRecord,
  onOpenJournal,
  onOpenNote,
}: JournalCalendarProps) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const today = getTodayString();

  // 构建月历数据
  const calendarDays = useMemo<DayCellData[]>(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    // 周一开始：把 getDay() (0=周日) 转换为周一开始的偏移
    let startOffset = firstDay.getDay() - 1; // 周一=0
    if (startOffset < 0) startOffset = 6; // 周日 -> 6
    const daysInMonth = lastDay.getDate();

    const days: DayCellData[] = [];

    // 上月末尾
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push(buildDayCell(dateStr, day, false, notes, journals, foodEntries, moodEntries));
    }

    // 当月
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push(buildDayCell(dateStr, day, true, notes, journals, foodEntries, moodEntries));
    }

    // 补全最后一行（周日结尾）
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let day = 1; day <= remaining; day++) {
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
        const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        days.push(buildDayCell(dateStr, day, false, notes, journals, foodEntries, moodEntries));
      }
    }

    return days;
  }, [currentYear, currentMonth, notes, journals, foodEntries, moodEntries]);

  // 当月统计
  const monthStats = useMemo(() => {
    let journalCount = 0;
    let noteCount = 0;
    let photoCount = 0;
    const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    journals.forEach((j) => {
      if (j.date.startsWith(monthPrefix)) {
        journalCount++;
        if (j.imageUri) photoCount++;
      }
    });
    notes.forEach((n) => {
      if (tsToDate(n.createdAt).startsWith(monthPrefix)) {
        noteCount++;
      }
    });
    foodEntries.forEach((f) => {
      if (f.date.startsWith(monthPrefix) && f.image) photoCount++;
      }
    );

    return { journalCount, noteCount, photoCount };
  }, [currentYear, currentMonth, journals, notes, foodEntries]);

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

  const handleDayPress = useCallback(
    (cell: DayCellData) => {
      if (!cell.isCurrentMonth) return;
      setSelectedDate(cell.date);
      setSheetVisible(true);
    },
    []
  );

  const handleCloseSheet = useCallback(() => {
    setSheetVisible(false);
    setSelectedDate(null);
  }, []);

  // 当前选中日期的详情数据
  const dayDetail = useMemo(() => {
    if (!selectedDate) return null;
    return getDayDetail(selectedDate, notes, journals, moodEntries, foodEntries);
  }, [selectedDate, notes, journals, moodEntries, foodEntries]);

  // 计算日历格子宽度
  const cellWidth = (SCREEN_WIDTH - spacing.lg * 2 - 4) / 7;

  return (
    <View style={styles.container}>
      {/* 月份导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleCenter}>
          <Text style={styles.monthTitle}>{currentYear}年{currentMonth}月</Text>
          <Text style={styles.monthSubtitle}>
            {monthStats.journalCount}篇手账 · {monthStats.noteCount}条便签 · {monthStats.photoCount}张照片
          </Text>
        </View>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* 星期头（周一开始） */}
      <View style={styles.weekHeader}>
        {WEEK_DAYS.map((day) => (
          <Text key={day} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      {/* 日期网格 */}
      <View style={styles.grid}>
        {calendarDays.map((cell, index) => {
          const isToday = cell.date === today;
          const cellW = cellWidth;

          return (
            <TouchableOpacity
              key={`${cell.date}-${index}`}
              style={[
                styles.dayCell,
                { width: cellW, height: cellW * 1.15 },
                !cell.isCurrentMonth && styles.dayCellOther,
              ]}
              onPress={() => handleDayPress(cell)}
              activeOpacity={cell.isCurrentMonth && cell.hasRecord ? 0.7 : 1}
              disabled={!cell.isCurrentMonth}
            >
              {cell.photo ? (
                // 有照片：显示缩略图 + 叠加日期数字
                <View style={styles.photoCell}>
                  <Image
                    source={{ uri: cell.photo }}
                    style={styles.cellPhoto}
                    resizeMode="cover"
                  />
                  <View style={styles.dateOverlay}>
                    <Text style={[styles.dateText, styles.dateTextOnPhoto]}>{cell.day}</Text>
                  </View>
                  {cell.recordCount > 1 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{cell.recordCount}</Text>
                    </View>
                  )}
                </View>
              ) : cell.hasRecord ? (
                // 有记录但无照片：显示日期 + 彩色圆点
                <View style={styles.recordCell}>
                  <Text style={[styles.dateText, isToday && styles.dateTextToday]}>{cell.day}</Text>
                  <View style={styles.dotsRow}>
                    {cell.dots.slice(0, 3).map((color, i) => (
                      <View key={i} style={[styles.dot, { backgroundColor: color }]} />
                    ))}
                    {cell.dots.length > 3 && (
                      <Text style={styles.dotMore}>+{cell.dots.length - 3}</Text>
                    )}
                  </View>
                </View>
              ) : (
                // 无记录：日期数字 + 极淡灰点
                <View style={styles.emptyCell}>
                  <Text style={[styles.dateText, styles.dateTextEmpty, isToday && styles.dateTextToday]}>{cell.day}</Text>
                  <View style={styles.emptyDot} />
                </View>
              )}

              {/* 今天标记 */}
              {isToday && cell.isCurrentMonth && (
                <View style={styles.todayIndicator} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 图例 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendPhoto} />
          <Text style={styles.legendText}>有照片</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accentWarm }]} />
          <Text style={styles.legendText}>有记录</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendEmptyDot} />
          <Text style={styles.legendText}>无记录</Text>
        </View>
      </View>

      {/* 当天详情弹窗 */}
      <DayDetailSheet
        visible={sheetVisible}
        detail={dayDetail}
        onClose={handleCloseSheet}
        onAddRecord={onAddRecord}
        onOpenJournal={onOpenJournal}
        onOpenNote={onOpenNote}
      />
    </View>
  );
}

/** 构建某天的格子数据 */
function buildDayCell(
  dateStr: string,
  day: number,
  isCurrentMonth: boolean,
  notes: Note[],
  journals: JournalEntry[],
  foods: FoodEntry[],
  moods: import('@/types').MoodEntry[]
): DayCellData {
  const dayJournals = journals.filter((j) => j.date === dateStr);
  const dayNotes = notes.filter((n) => tsToDate(n.createdAt) === dateStr);
  const dayFoods = foods.filter((f) => f.date === dateStr);
  const dayMoods = moods.filter((m) => m.date === dateStr);

  const recordCount = dayJournals.length + dayNotes.length + dayFoods.length + dayMoods.length;
  const hasRecord = recordCount > 0;

  // 第一张照片（优先手账，再饮食）
  let photo: string | null = null;
  for (const j of dayJournals) {
    if (j.imageUri) {
      photo = j.imageUri;
      break;
    }
  }
  if (!photo) {
    for (const f of dayFoods) {
      if (f.image) {
        photo = f.image;
        break;
      }
    }
  }

  // 分类色点
  const dots: string[] = [];
  dayJournals.forEach(() => {
    dots.push(colors.accentWarm);
  });
  dayNotes.forEach((n) => {
    dots.push(getNoteTagColor(n.tag));
  });
  dayFoods.forEach(() => {
    dots.push(colors.accentLemon);
  });
  dayMoods.forEach(() => {
    dots.push(colors.accentMint);
  });

  return {
    date: dateStr,
    day,
    isCurrentMonth,
    photo,
    dots,
    hasRecord,
    recordCount,
  };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleCenter: {
    alignItems: 'center',
  },
  monthTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  monthSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    padding: 2,
    position: 'relative',
  },
  dayCellOther: {
    opacity: 0.25,
  },

  // 照片格子
  photoCell: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  cellPhoto: {
    width: '100%',
    height: '100%',
  },
  dateOverlay: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  dateTextOnPhoto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  countBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  countText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // 有记录格子
  recordCell: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  dateText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dateTextToday: {
    color: colors.primary,
    fontWeight: '800',
  },
  dateTextEmpty: {
    color: colors.textHint,
  fontWeight: '400',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 3,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotMore: {
    fontSize: 8,
    color: colors.textHint,
  },

  // 无记录格子
  emptyCell: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  emptyDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.divider,
    marginTop: 3,
  },

  // 今天标记
  todayIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  // 图例
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendPhoto: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: colors.accentWarm + '40',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendEmptyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

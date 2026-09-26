import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import type { Note, JournalEntry, MoodEntry, FoodEntry } from '@/types';
import {
  getJournalSummary,
  type JournalSummaryData,
} from '@/services/journal-summary.service';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const SCREEN_WIDTH = Dimensions.get('window').width;

type Period = 'week' | 'month' | 'year';

interface JournalSummaryProps {
  notes: Note[];
  journals: JournalEntry[];
  moodEntries: MoodEntry[];
  foodEntries: FoodEntry[];
}

export function JournalSummary({
  notes,
  journals,
  moodEntries,
  foodEntries,
}: JournalSummaryProps) {
  const [period, setPeriod] = useState<Period>('week');

  const summary = useMemo(
    () => getJournalSummary(period, notes, journals, moodEntries, foodEntries),
    [period, notes, journals, moodEntries, foodEntries]
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* 温暖文案 */}
      <View style={styles.highlightCard}>
        <Text style={styles.highlightEmoji}>☁️</Text>
        <Text style={styles.highlightText}>{summary.highlightText}</Text>
      </View>

      {/* 核心数据卡片 */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="book-heart"
          label="手账"
          value={summary.journalCount}
          color={colors.accentWarm}
        />
        <StatCard
          icon="note-text"
          label="便签"
          value={summary.noteCount}
          color={colors.accentMint}
        />
        <StatCard
          icon="camera"
          label="照片"
          value={summary.totalPhotos}
          color={colors.primary}
        />
        <StatCard
          icon="calendar-check"
          label="记录天数"
          value={`${summary.recordedDays}/${summary.totalDays}`}
          color={colors.accentLavender}
        />
      </View>

      {/* 分类分布条形图 */}
      {summary.categoryStats.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>分类分布</Text>
          <CategoryBarChart data={summary.categoryStats} />
        </View>
      )}

      {/* 热力图 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {period === 'year' ? '全年记录热力图' : period === 'month' ? '本月记录热力图' : '本周记录热力图'}
        </Text>
        {period === 'year' && summary.monthlyHeatmap ? (
          <YearlyHeatmap data={summary.dailyHeatmap} monthlyData={summary.monthlyHeatmap} />
        ) : period === 'month' ? (
          <MonthHeatmap data={summary.dailyHeatmap} />
        ) : (
          <WeekHeatmap data={summary.dailyHeatmap} />
        )}
      </View>

      {/* 照片墙 */}
      {summary.photoWall.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {period === 'year' ? '年度精选照片' : period === 'month' ? '本月精选照片' : '本周高光时刻'}
          </Text>
          {period === 'year' ? (
            <PhotoWall photos={summary.photoWall} columns={4} />
          ) : (
            <PhotoWall photos={summary.photoWall} columns={3} />
          )}
        </View>
      )}

      {/* 高光时刻 - 单张大图 */}
      {summary.highlightPhoto && period === 'week' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>本周高光时刻</Text>
          <Image
            source={{ uri: summary.highlightPhoto }}
            style={styles.highlightPhoto}
            resizeMode="cover"
          />
        </View>
      )}

      {/* 心情曲线 (周/月) */}
      {summary.moodEntries.length > 0 && period !== 'year' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>心情记录</Text>
          <MoodTimeline entries={summary.moodEntries} />
        </View>
      )}

      {/* 月度日历缩略图 (月总结) */}
      {period === 'month' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>月度日历缩略图</Text>
          <MiniMonthCalendar heatmap={summary.dailyHeatmap} />
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// === 子组件 ===

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CategoryBarChart({
  data,
}: {
  data: { label: string; count: number; color: string }[];
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <View style={styles.barChart}>
      {data.map((item, index) => (
        <View key={`${item.label}-${index}`} style={styles.barRow}>
          <Text style={styles.barLabel}>{item.label}</Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${(item.count / maxCount) * 100}%`,
                  backgroundColor: item.color,
                },
              ]}
            />
          </View>
          <Text style={styles.barCount}>{item.count}</Text>
        </View>
      ))}
    </View>
  );
}

function WeekHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];
  return (
    <View style={styles.weekHeatmap}>
      {data.map((item, index) => {
        const intensity = getHeatColor(item.count);
        return (
          <View key={item.date} style={styles.weekDayCell}>
            <Text style={styles.heatDayLabel}>{weekLabels[index] || ''}</Text>
            <View
              style={[styles.heatCell, { backgroundColor: intensity }]}
            >
              <Text style={styles.heatCount}>
                {item.count > 0 ? item.count : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function MonthHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const cellSize = (SCREEN_WIDTH - spacing.lg * 2 - 32 - 6 * 4) / 7;

  return (
    <View style={styles.monthHeatmap}>
      {data.map((item) => {
        const intensity = getHeatColor(item.count);
        const dayNum = parseInt(item.date.split('-')[2], 10);
        return (
          <View
            key={item.date}
            style={[styles.monthHeatCell, { width: cellSize, height: cellSize, backgroundColor: intensity }]}
          >
            <Text style={styles.monthHeatDay}>{dayNum}</Text>
            {item.count > 0 && (
              <Text style={styles.monthHeatCount}>{item.count}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function YearlyHeatmap({
  data,
  monthlyData,
}: {
  data: { date: string; count: number }[];
  monthlyData: { month: number; count: number }[];
}) {
  // 按月分组显示，GitHub 风格
  const cellSize = (SCREEN_WIDTH - spacing.lg * 2 - 12 * 3) / 13;

  return (
    <View>
      {/* 月度条形图 */}
      <View style={styles.monthBarChart}>
        {monthlyData.map((item) => {
          const maxCount = Math.max(...monthlyData.map((m) => m.count), 1);
          const heightPct = (item.count / maxCount) * 100;
          return (
            <View key={item.month} style={styles.monthBarCol}>
              <View style={styles.monthBarTrack}>
                <View
                  style={[
                    styles.monthBarFill,
                    {
                      height: `${Math.max(heightPct, item.count > 0 ? 8 : 0)}%`,
                      backgroundColor: getHeatColor(item.count),
                    },
                  ]}
                />
              </View>
              <Text style={styles.monthBarLabel}>{item.month}月</Text>
              {item.count > 0 && (
                <Text style={styles.monthBarCount}>{item.count}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function PhotoWall({
  photos,
  columns,
}: {
  photos: string[];
  columns: number;
}) {
  const photoSize =
    (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * (columns - 1) - 32) / columns;

  return (
    <View style={styles.photoWall}>
      {photos.map((photo, index) => (
        <Image
          key={index}
          source={{ uri: photo }}
          style={[
            styles.photoItem,
            { width: photoSize, height: photoSize },
          ]}
          resizeMode="cover"
        />
      ))}
    </View>
  );
}

function MoodTimeline({ entries }: { entries: MoodEntry[] }) {
  const moodEmoji: Record<string, string> = {
    happy: '😊',
    calm: '😌',
    tired: '😴',
    sad: '😢',
    excited: '🤩',
    angry: '😠',
  };

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <View style={styles.moodTimeline}>
      {sorted.slice(0, 10).map((entry) => (
        <View key={entry.id} style={styles.moodTimelineItem}>
          <Text style={styles.moodTimelineEmoji}>
            {moodEmoji[entry.mood] || '☁️'}
          </Text>
          <View style={styles.moodTimelineContent}>
            <Text style={styles.moodTimelineDate}>
              {format(new Date(entry.date), 'M月d日', { locale: zhCN })}
            </Text>
            {entry.content ? (
              <Text style={styles.moodTimelineText} numberOfLines={1}>
                {entry.content}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function MiniMonthCalendar({ heatmap }: { heatmap: { date: string; count: number }[] }) {
  const cellSize = (SCREEN_WIDTH - spacing.lg * 2 - 32 - 6 * 2) / 7;
  const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <View>
      <View style={styles.miniWeekHeader}>
        {weekLabels.map((d) => (
          <Text key={d} style={styles.miniWeekLabel}>{d}</Text>
        ))}
      </View>
      <View style={styles.miniGrid}>
        {heatmap.map((item) => {
          const intensity = getHeatColor(item.count);
          return (
            <View
              key={item.date}
              style={[styles.miniCell, { width: cellSize, height: cellSize, backgroundColor: intensity }]}
            />
          );
        })}
      </View>
    </View>
  );
}

// === 辅助函数 ===

/** 根据记录数量获取热力颜色 */
function getHeatColor(count: number): string {
  if (count === 0) return colors.divider;
  if (count === 1) return colors.primaryLight + '60';
  if (count === 2) return colors.primaryLight;
  if (count <= 4) return colors.primary;
  return colors.primaryDark;
}

// === 样式 ===

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxl,
  },

  // 温暖文案
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  highlightEmoji: {
    fontSize: 28,
  },
  highlightText: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },

  // 核心数据
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // 卡片通用
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },

  // 分类条形图
  barChart: {
    gap: spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barLabel: {
    width: 50,
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 20,
    backgroundColor: colors.divider,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  barCount: {
    width: 28,
    textAlign: 'right',
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },

  // 周热力图
  weekHeatmap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  heatDayLabel: {
    ...typography.caption,
    color: colors.textHint,
    marginBottom: 4,
  },
  heatCell: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatCount: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },

  // 月热力图
  monthHeatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  monthHeatCell: {
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthHeatDay: {
    fontSize: 9,
    color: colors.textHint,
  },
  monthHeatCount: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // 年度月度条形图
  monthBarChart: {
    flexDirection: 'row',
    gap: 3,
    height: 120,
    alignItems: 'flex-end',
  },
  monthBarCol: {
    flex: 1,
    alignItems: 'center',
  },
  monthBarTrack: {
    width: '100%',
    height: '80%',
    justifyContent: 'flex-end',
  },
  monthBarFill: {
    width: '100%',
    borderRadius: 3,
    minHeight: 4,
  },
  monthBarLabel: {
    fontSize: 9,
    color: colors.textHint,
    marginTop: 4,
  },
  monthBarCount: {
    fontSize: 9,
    color: colors.textPrimary,
    fontWeight: '600',
  },

  // 照片墙
  photoWall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoItem: {
    borderRadius: borderRadius.md,
  },

  // 高光照片
  highlightPhoto: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
  },

  // 心情时间线
  moodTimeline: {
    gap: spacing.sm,
  },
  moodTimelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  moodTimelineEmoji: {
    fontSize: 28,
  },
  moodTimelineContent: {
    flex: 1,
  },
  moodTimelineDate: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  moodTimelineText: {
    ...typography.body2,
    color: colors.textPrimary,
  },

  // 迷你月历
  miniWeekHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  miniWeekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    color: colors.textHint,
  },
  miniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  miniCell: {
    borderRadius: 3,
  },

  bottomSpacer: {
    height: 20,
  },
});

// === 顶部周期切换按钮 (导出给父组件使用) ===

export function PeriodSwitch({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  const options: { key: Period; label: string }[] = [
    { key: 'week', label: '本周' },
    { key: 'month', label: '本月' },
    { key: 'year', label: '本年' },
  ];

  return (
    <View style={periodSwitchStyles.container}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[
            periodSwitchStyles.btn,
            period === opt.key && periodSwitchStyles.btnActive,
          ]}
          onPress={() => onChange(opt.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              periodSwitchStyles.text,
              period === opt.key && periodSwitchStyles.textActive,
            ]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const periodSwitchStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.pill,
    padding: 4,
    marginBottom: spacing.md,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
  },
  btnActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  text: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  textActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
  addDays,
} from 'date-fns';
import { FoodDetailSheet } from '@/components/FoodDetailSheet';
import { FoodInsightsSheet } from '@/components/FoodInsightsSheet';
import { useFoodStore, MEAL_META, calcKcal } from '@/stores/food.store';
import { getTodayString, getWeekRange } from '@/utils/date';
import type { FoodEntry, Meal, MealPlanItem } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

// === 设计稿配色系统 ===
const D = {
  pageBg: '#F2F2F7',       // 页面背景 极浅灰
  cardBg: '#FFFFFF',       // 主背景/卡片 白色
  textPrimary: '#000000',  // 主文字
  textSecondary: '#666666',// 次要文字
  textHint: '#999999',     // 辅助文字
  segmentBg: '#F5F5F7',    // 分段控制器背景
  divider: '#F2F2F7',      // 分割线
  blue: '#007AFF',         // 蓝色（添加按钮等）
};

// 月视图缩略图：微小圆角4px
const MONTH_THUMB_RADIUS = 4;
// 周视图缩略图：80×60px 圆角8px
const WEEK_THUMB_W = 80;
const WEEK_THUMB_H = 60;
const WEEK_THUMB_RADIUS = 8;
// 计划视图圆形缩略图 24px
const PLAN_THUMB = 24;

// 周几彩色下划线（设计稿：周一黄/周二蓝/周三绿/周四粉/周五紫/周六橙）
const WEEKDAY_COLORS: Record<number, string> = {
  1: '#FFD700', // 周一 黄
  2: '#007AFF', // 周二 蓝
  3: '#34C759', // 周三 绿
  4: '#FF2D55', // 周四 粉
  5: '#C3B1E1', // 周五 紫
  6: '#FF9500', // 周六 橙
  0: '#5AC8FA', // 周日 青
};

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

type ViewMode = 'month' | 'week';
type TabMode = 'record' | 'plan';
type PlanMode = 'day' | 'week';

// === 胶囊分段控制器（pill shape） ===
interface PillOption<T extends string> {
  label: string;
  value: T;
}

function PillSegment<T extends string>({
  options,
  value,
  onChange,
  fullWidth = false,
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (v: T) => void;
  fullWidth?: boolean;
}) {
  return (
    <View style={[pillStyles.container, fullWidth && pillStyles.containerFull]}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              pillStyles.option,
              active && pillStyles.optionActive,
              fullWidth && pillStyles.optionFull,
            ]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[pillStyles.text, active && pillStyles.textActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const pillStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: D.segmentBg, // #F5F5F7
    borderRadius: 16, // 圆角16px
    padding: 3,
    alignSelf: 'center',
  },
  containerFull: {
    alignSelf: 'stretch',
  },
  option: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionFull: {
    flex: 1,
  },
  optionActive: {
    backgroundColor: D.cardBg, // 白色背景
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  text: {
    fontSize: 13, // 12-13pt
    fontWeight: '500',
    color: D.textHint, // 灰色文字
  },
  textActive: {
    color: D.textPrimary, // 黑色文字
    fontWeight: '600',
  },
});

export default function FoodScreen() {
  const entries = useFoodStore((s) => s.entries);
  const plans = useFoodStore((s) => s.plans);
  const getEntriesByDate = useFoodStore((s) => s.getEntriesByDate);
  const getPlansByDate = useFoodStore((s) => s.getPlansByDate);
  const togglePlan = useFoodStore((s) => s.togglePlan);
  const removePlan = useFoodStore((s) => s.removePlan);
  const deleteEntry = useFoodStore((s) => s.deleteEntry);
  const getInsights = useFoodStore((s) => s.getInsights);

  const [tabMode, setTabMode] = useState<TabMode>('record');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [planMode, setPlanMode] = useState<PlanMode>('week');
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [prevMonthCollapsed, setPrevMonthCollapsed] = useState(true);

  const [detailEntry, setDetailEntry] = useState<FoodEntry | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [insightsVisible, setInsightsVisible] = useState(false);
  const [dayListVisible, setDayListVisible] = useState(false);

  // 本周饮食小结（入口条）
  const weekInsights = useMemo(() => getInsights('week'), [getInsights, entries]);

  // === 月历网格 ===
  const calendarDays = useMemo(() => {
    const monthStart = new Date(calendarMonth.year, calendarMonth.month, 1);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(monthStart);
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [calendarMonth]);

  // 上月日期网格（折叠预览）
  const prevMonthDays = useMemo(() => {
    const prev = new Date(calendarMonth.year, calendarMonth.month - 1, 1);
    const gridStart = startOfWeek(prev, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(prev);
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [calendarMonth]);

  // 每天的记录数和热量
  const dayStatsMap = useMemo(() => {
    const map: Record<string, { count: number; kcal: number }> = {};
    entries.forEach((e) => {
      if (!map[e.date]) map[e.date] = { count: 0, kcal: 0 };
      map[e.date].count++;
      map[e.date].kcal += calcKcal(e);
    });
    return map;
  }, [entries]);

  // === 周视图数据 ===
  const weekDays = useMemo(() => {
    const [weekStartStr] = getWeekRange(selectedDate);
    const start = parseISO(weekStartStr);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  // 周视图倒序（最新在上）
  const weekDaysReversed = useMemo(() => [...weekDays].reverse(), [weekDays]);

  // 选中日期的记录
  const selectedDateEntries = useMemo(() => {
    return getEntriesByDate(selectedDate);
  }, [getEntriesByDate, selectedDate, entries]);

  // 选中日期的计划
  const selectedDatePlans = useMemo(() => {
    return getPlansByDate(selectedDate);
  }, [getPlansByDate, selectedDate, plans]);

  const today = getTodayString();

  // === 计划周视图数据 ===
  const planWeekDays = useMemo(() => {
    const [weekStartStr] = getWeekRange(today);
    const start = parseISO(weekStartStr);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [today]);

  // 双列分组：左列 周一/三/五/日，右列 周二/四/六
  const planLeftCol = useMemo(() => {
    return planWeekDays.filter((d) => {
      const dow = d.getDay();
      return dow === 1 || dow === 3 || dow === 5 || dow === 0;
    });
  }, [planWeekDays]);

  const planRightCol = useMemo(() => {
    return planWeekDays.filter((d) => {
      const dow = d.getDay();
      return dow === 2 || dow === 4 || dow === 6;
    });
  }, [planWeekDays]);

  // === 事件处理 ===
  const handleDayPress = (dateStr: string) => {
    setSelectedDate(dateStr);
    setDayListVisible(true);
  };

  const handleEntryPress = (entry: FoodEntry) => {
    setDetailEntry(entry);
    setDetailVisible(true);
  };

  const handleEditEntry = (entry: FoodEntry) => {
    setDetailVisible(false);
    router.push({ pathname: '/food-edit', params: { entryId: entry.id } } as any);
  };

  const handleDeleteEntry = (id: string) => {
    deleteEntry(id);
    setDetailVisible(false);
    setDayListVisible(false);
  };

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => {
      const d = new Date(prev.year, prev.month, 1);
      d.setMonth(d.getMonth() - 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      const d = new Date(prev.year, prev.month, 1);
      d.setMonth(d.getMonth() + 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const handleRefreshMonth = () => {
    const now = new Date();
    setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });
  };

  const monthLabel = format(
    new Date(calendarMonth.year, calendarMonth.month, 1),
    'yyyy年MM月',
    { locale: zhCN }
  );

  const prevMonthLabel = format(
    new Date(calendarMonth.year, calendarMonth.month - 1, 1),
    'yyyy年MM月',
    { locale: zhCN }
  );

  // 周时间范围标签
  const weekRangeLabel = useMemo(() => {
    if (weekDays.length === 0) return '';
    const start = weekDays[0];
    const end = weekDays[6];
    return `${format(start, 'M月d日', { locale: zhCN })}-${format(end, 'd日', { locale: zhCN })}`;
  }, [weekDays]);

  // 获取某天的记录列表
  const getDayThumbnails = useCallback(
    (dateStr: string) => {
      return entries.filter((e) => e.date === dateStr);
    },
    [entries]
  );

  // 获取某天的第一张照片
  const getDayFirstImage = useCallback(
    (dateStr: string): string | null => {
      const dayEntries = entries.filter((e) => e.date === dateStr);
      for (const e of dayEntries) {
        if (e.image) return e.image;
      }
      return null;
    },
    [entries]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={D.pageBg} />

      {/* 顶部标题 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {tabMode === 'record' ? '饮食日历' : '饮食计划'}
        </Text>
        {tabMode === 'record' && (
          <TouchableOpacity
            style={styles.insightsEntry}
            onPress={() => setInsightsVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chart-bar" size={16} color={D.blue} />
            <Text style={styles.insightsEntryText}>
              {weekInsights.recordedDays}天 · 均{weekInsights.avgKcal}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 胶囊分段控制器：记录 / 计划 */}
      <View style={styles.segmentRow}>
        <PillSegment
          options={[
            { label: '记录', value: 'record' },
            { label: '计划', value: 'plan' },
          ]}
          value={tabMode}
          onChange={setTabMode}
          fullWidth
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabMode === 'record' ? (
          <>
            {/* 胶囊分段控制器：按月 / 按周 */}
            <View style={styles.subSegmentRow}>
              <PillSegment
                options={[
                  { label: '按月', value: 'month' },
                  { label: '按周', value: 'week' },
                ]}
                value={viewMode}
                onChange={setViewMode}
              />
            </View>

            {viewMode === 'month' ? (
              <MonthCalendarView
                calendarDays={calendarDays}
                dayStatsMap={dayStatsMap}
                today={today}
                monthLabel={monthLabel}
                currentYear={calendarMonth.year}
                currentMonth={calendarMonth.month}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onRefreshMonth={handleRefreshMonth}
                onDayPress={handleDayPress}
                getDayFirstImage={getDayFirstImage}
                getDayThumbnails={getDayThumbnails}
                prevMonthDays={prevMonthDays}
                prevMonthLabel={prevMonthLabel}
                prevMonthCollapsed={prevMonthCollapsed}
                onTogglePrevMonth={() => setPrevMonthCollapsed((v) => !v)}
              />
            ) : (
              <WeekPhotoListView
                weekDays={weekDaysReversed}
                getDayThumbnails={getDayThumbnails}
                today={today}
                weekRangeLabel={weekRangeLabel}
                onDayPress={handleDayPress}
                onEntryPress={handleEntryPress}
              />
            )}
          </>
        ) : (
          <PlanView
            planMode={planMode}
            setPlanMode={setPlanMode}
            selectedDate={selectedDate}
            plans={selectedDatePlans}
            planWeekDays={planWeekDays}
            planLeftCol={planLeftCol}
            planRightCol={planRightCol}
            getPlansByDate={getPlansByDate}
            onToggle={togglePlan}
            onRemove={removePlan}
            onAdd={() =>
              router.push({ pathname: '/food-edit', params: { planMode: '1' } } as any)
            }
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* FAB 记一餐 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/food-edit' as any)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>记一餐</Text>
      </TouchableOpacity>

      {/* 食物详情弹层 */}
      <FoodDetailSheet
        entry={detailEntry}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onEdit={handleEditEntry}
        onDelete={handleDeleteEntry}
      />

      {/* 统计弹层 */}
      <FoodInsightsSheet
        visible={insightsVisible}
        onClose={() => setInsightsVisible(false)}
      />

      {/* 当天饮食清单（Modal） */}
      <DayListModal
        visible={dayListVisible}
        date={selectedDate}
        entries={selectedDateEntries}
        onClose={() => setDayListVisible(false)}
        onEntryPress={handleEntryPress}
        onAdd={() => {
          setDayListVisible(false);
          router.push('/food-edit' as any);
        }}
      />
    </SafeAreaView>
  );
}

// === 月历视图组件 ===
interface MonthCalendarViewProps {
  calendarDays: Date[];
  dayStatsMap: Record<string, { count: number; kcal: number }>;
  today: string;
  monthLabel: string;
  currentYear: number;
  currentMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onRefreshMonth: () => void;
  onDayPress: (dateStr: string) => void;
  getDayFirstImage: (dateStr: string) => string | null;
  getDayThumbnails: (dateStr: string) => FoodEntry[];
  prevMonthDays: Date[];
  prevMonthLabel: string;
  prevMonthCollapsed: boolean;
  onTogglePrevMonth: () => void;
}

function MonthCalendarView({
  calendarDays,
  dayStatsMap,
  today,
  monthLabel,
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onRefreshMonth,
  onDayPress,
  getDayFirstImage,
  getDayThumbnails,
  prevMonthDays,
  prevMonthLabel,
  prevMonthCollapsed,
  onTogglePrevMonth,
}: MonthCalendarViewProps) {
  return (
    <View style={styles.monthContainer}>
      {/* 月份标题 14pt黑色 + 右侧刷新图标 */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={onPrevMonth} activeOpacity={0.7} style={styles.monthNavBtn}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={D.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={onNextMonth} activeOpacity={0.7} style={styles.monthNavBtn}>
          <MaterialCommunityIcons name="chevron-right" size={22} color={D.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onRefreshMonth} activeOpacity={0.7} style={styles.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={18} color={D.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* 星期标签 周一~周日 10-11pt 浅灰#999 */}
      <View style={styles.calWeekDayRow}>
        {WEEKDAY_LABELS.map((d) => (
          <View key={d} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* 7列网格 - 正方形微小圆角4px照片 */}
      <View style={styles.dateGrid}>
        {calendarDays.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const stats = dayStatsMap[dateStr];
          const isCurrentMonth =
            day.getFullYear() === currentYear && day.getMonth() === currentMonth;
          const isTodayCell = dateStr === today;
          const hasRecords = stats && stats.count > 0;
          const firstImage = hasRecords ? getDayFirstImage(dateStr) : null;
          const dayEntries = hasRecords ? getDayThumbnails(dateStr) : [];

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dateCell,
                !isCurrentMonth && styles.dateCellOtherMonth,
              ]}
              onPress={() => onDayPress(dateStr)}
              activeOpacity={0.7}
            >
              {hasRecords && firstImage ? (
                // 有记录且有照片：照片填满格子 微小圆角4px
                <View style={styles.dateThumbWrap}>
                  <Image
                    source={{ uri: firstImage }}
                    style={styles.dateThumb}
                    resizeMode="cover"
                  />
                  {dayEntries.length > 1 && (
                    <View style={styles.dateCountBadge}>
                      <Text style={styles.dateCountText}>{dayEntries.length}</Text>
                    </View>
                  )}
                </View>
              ) : hasRecords ? (
                // 有记录但无照片：显示餐别emoji
                <View style={[styles.dateThumb, styles.dateThumbEmoji]}>
                  <Text style={styles.dateThumbEmojiText}>
                    {MEAL_META[dayEntries[0].meal].emoji}
                  </Text>
                  {dayEntries.length > 1 && (
                    <View style={styles.dateCountBadge}>
                      <Text style={styles.dateCountText}>{dayEntries.length}</Text>
                    </View>
                  )}
                </View>
              ) : (
                // 无记录：淡灰色日期数字
                <View style={styles.dateEmpty}>
                  <Text
                    style={[
                      styles.dateNumber,
                      !isCurrentMonth && styles.dateNumberOther,
                      isTodayCell && styles.dateNumberToday,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 底部可折叠上月预览 */}
      <TouchableOpacity
        style={styles.prevMonthToggle}
        onPress={onTogglePrevMonth}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={prevMonthCollapsed ? 'chevron-down' : 'chevron-up'}
          size={18}
          color={D.textSecondary}
        />
        <Text style={styles.prevMonthLabel}>{prevMonthLabel}</Text>
      </TouchableOpacity>

      {!prevMonthCollapsed && (
        <View style={styles.prevMonthGrid}>
          <View style={styles.calWeekDayRow}>
            {WEEKDAY_LABELS.map((d) => (
              <View key={d} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{d}</Text>
              </View>
            ))}
          </View>
          <View style={styles.dateGrid}>
            {prevMonthDays.map((day, i) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const stats = dayStatsMap[dateStr];
              const hasRecords = stats && stats.count > 0;
              const firstImage = hasRecords ? getDayFirstImage(dateStr) : null;
              const dayEntries = hasRecords ? getDayThumbnails(dateStr) : [];

              return (
                <TouchableOpacity
                  key={i}
                  style={styles.dateCell}
                  onPress={() => onDayPress(dateStr)}
                  activeOpacity={0.7}
                >
                  {hasRecords && firstImage ? (
                    <View style={styles.dateThumbWrap}>
                      <Image
                        source={{ uri: firstImage }}
                        style={styles.dateThumb}
                        resizeMode="cover"
                      />
                    </View>
                  ) : hasRecords ? (
                    <View style={[styles.dateThumb, styles.dateThumbEmoji]}>
                      <Text style={styles.dateThumbEmojiText}>
                        {MEAL_META[dayEntries[0].meal].emoji}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.dateEmpty}>
                      <Text style={[styles.dateNumber, styles.dateNumberOther]}>
                        {day.getDate()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// === 周列表视图组件 ===
interface WeekPhotoListViewProps {
  weekDays: Date[]; // 倒序排列
  getDayThumbnails: (dateStr: string) => FoodEntry[];
  today: string;
  weekRangeLabel: string;
  onDayPress: (dateStr: string) => void;
  onEntryPress: (entry: FoodEntry) => void;
}

function WeekPhotoListView({
  weekDays,
  getDayThumbnails,
  today,
  weekRangeLabel,
  onDayPress,
  onEntryPress,
}: WeekPhotoListViewProps) {
  return (
    <View style={styles.weekListContainer}>
      {/* 时间范围 14pt */}
      <Text style={styles.weekRangeText}>{weekRangeLabel}</Text>

      {weekDays.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayEntries = getDayThumbnails(dateStr);
        const isTodayCell = dateStr === today;
        const isPast = dateStr < today;
        const weekLabel = format(day, 'EEEE', { locale: zhCN });
        const dayKcal = dayEntries.reduce((sum, e) => sum + calcKcal(e), 0);
        const dow = day.getDay();
        const dotColor = WEEKDAY_COLORS[dow] || D.textHint;

        return (
          <View key={dateStr} style={styles.weekDayRow}>
            {/* 日期标签 12pt灰色 + 小圆点标识 */}
            <View style={styles.weekDateRow}>
              <View style={styles.weekDateLeft}>
                <View style={[styles.weekDateDot, { backgroundColor: dotColor }]} />
                <Text style={[styles.weekDateLabel, isTodayCell && styles.weekDateLabelToday]}>
                  {weekLabel} {day.getDate()}日
                </Text>
              </View>
              {dayKcal > 0 && (
                <Text style={styles.weekDayKcal}>{dayKcal} kcal</Text>
              )}
            </View>

            {/* 食物照片横排 80×60 圆角8px */}
            {dayEntries.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.weekThumbRow}
              >
                {dayEntries.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    onPress={() => onEntryPress(entry)}
                    activeOpacity={0.8}
                  >
                    {entry.image ? (
                      <View style={styles.weekThumbWrap}>
                        <Image
                          source={{ uri: entry.image }}
                          style={[styles.weekThumb, isPast && styles.weekThumbPast]}
                          resizeMode="cover"
                        />
                        {isPast && <View style={styles.weekThumbOverlay} />}
                      </View>
                    ) : (
                      <View style={[styles.weekThumb, styles.weekThumbEmojiBox]}>
                        <Text style={styles.weekThumbEmoji}>
                          {MEAL_META[entry.meal].emoji}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <TouchableOpacity
                style={styles.weekEmpty}
                onPress={() => onDayPress(dateStr)}
                activeOpacity={0.7}
              >
                <Text style={styles.weekEmptyText}>暂无记录</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

// === 计划视图 ===
interface PlanViewProps {
  planMode: PlanMode;
  setPlanMode: (m: PlanMode) => void;
  selectedDate: string;
  plans: MealPlanItem[];
  planWeekDays: Date[];
  planLeftCol: Date[];
  planRightCol: Date[];
  getPlansByDate: (date: string) => MealPlanItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

function PlanView({
  planMode,
  setPlanMode,
  selectedDate,
  plans,
  planWeekDays,
  planLeftCol,
  planRightCol,
  getPlansByDate,
  onToggle,
  onRemove,
  onAdd,
}: PlanViewProps) {
  const meals: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <View style={styles.planContainer}>
      {/* 计划头部：标题 + 右上角添加按钮（蓝色文字） */}
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>饮食计划</Text>
        <TouchableOpacity onPress={onAdd} activeOpacity={0.7} style={styles.planAddBtn}>
          <MaterialCommunityIcons name="plus" size={18} color={D.blue} />
          <Text style={styles.planAddText}>添加</Text>
        </TouchableOpacity>
      </View>

      {/* 胶囊分段控制器：按天 | 按周 */}
      <View style={styles.planSegmentRow}>
        <PillSegment
          options={[
            { label: '按天', value: 'day' },
            { label: '按周', value: 'week' },
          ]}
          value={planMode}
          onChange={setPlanMode}
        />
      </View>

      {planMode === 'day' ? (
        // 按天视图
        <View style={styles.planDayContainer}>
          {plans.length === 0 ? (
            <View style={styles.planEmpty}>
              <Text style={styles.planEmptyEmoji}>📋</Text>
              <Text style={styles.planEmptyText}>今天还没有饮食计划</Text>
              <Text style={styles.planEmptyHint}>添加计划，让饮食更规律~</Text>
            </View>
          ) : (
            meals.map((meal) => {
              const mealPlans = plans.filter((p) => p.meal === meal);
              if (mealPlans.length === 0) return null;
              const meta = MEAL_META[meal];
              return (
                <View key={meal} style={styles.planMealSection}>
                  <Text style={styles.planMealTitle}>{meta.emoji} {meta.label}</Text>
                  {mealPlans.map((plan) => (
                    <View key={plan.id} style={styles.planItem}>
                      <TouchableOpacity
                        style={styles.planCheckBtn}
                        onPress={() => onToggle(plan.id)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={plan.done ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                          size={22}
                          color={plan.done ? '#34C759' : D.textHint}
                        />
                      </TouchableOpacity>
                      <View style={styles.planItemContent}>
                        <Text style={styles.planItemEmoji}>{plan.emoji}</Text>
                        <Text style={[styles.planItemName, plan.done && styles.planItemNameDone]}>
                          {plan.name}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => onRemove(plan.id)}
                        style={styles.planRemoveBtn}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="close" size={16} color={D.textHint} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </View>
      ) : (
        // 按周双列流式布局
        <View style={styles.planWeekContainer}>
          <View style={styles.planWeekCol}>
            {planLeftCol.map((day) => (
              <PlanWeekDayCard
                key={day.toISOString()}
                day={day}
                plans={getPlansByDate(format(day, 'yyyy-MM-dd'))}
                onToggle={onToggle}
                onRemove={onRemove}
              />
            ))}
          </View>
          <View style={styles.planWeekCol}>
            {planRightCol.map((day) => (
              <PlanWeekDayCard
                key={day.toISOString()}
                day={day}
                plans={getPlansByDate(format(day, 'yyyy-MM-dd'))}
                onToggle={onToggle}
                onRemove={onRemove}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// === 周计划日期卡片 ===
interface PlanWeekDayCardProps {
  day: Date;
  plans: MealPlanItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

function PlanWeekDayCard({ day, plans, onToggle, onRemove }: PlanWeekDayCardProps) {
  const dow = day.getDay();
  const dowColor = WEEKDAY_COLORS[dow] || D.blue;
  const dowLabel = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dow];
  const dateLabel = format(day, 'M月d日', { locale: zhCN });

  return (
    <View style={styles.planWeekCard}>
      {/* 日期标签 12pt黑色 + 彩色短下划线 */}
      <View style={styles.planWeekDateRow}>
        <Text style={styles.planWeekDowLabel}>{dowLabel}</Text>
        <View style={styles.planWeekDateSubRow}>
          <Text style={styles.planWeekDateLabel}>{dateLabel}</Text>
          <View style={[styles.planWeekUnderline, { backgroundColor: dowColor }]} />
        </View>
      </View>

      {/* 食物条目：圆形缩略图24px + 食物名称13pt灰色 行高36pt */}
      {plans.length > 0 ? (
        plans.map((plan) => (
          <View key={plan.id} style={styles.planWeekItem}>
            <TouchableOpacity
              style={styles.planWeekCheckBtn}
              onPress={() => onToggle(plan.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={plan.done ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                size={16}
                color={plan.done ? '#34C759' : D.textHint}
              />
            </TouchableOpacity>
            <View style={styles.planWeekThumbBox}>
              <Text style={styles.planWeekThumbEmoji}>{plan.emoji}</Text>
            </View>
            <Text
              style={[styles.planWeekItemName, plan.done && styles.planItemNameDone]}
              numberOfLines={1}
            >
              {plan.name}
            </Text>
            <TouchableOpacity
              onPress={() => onRemove(plan.id)}
              style={styles.planWeekRemoveBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={14} color={D.textHint} />
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={styles.planWeekEmpty}>—</Text>
      )}
    </View>
  );
}

// === 当天饮食清单 Modal ===
interface DayListModalProps {
  visible: boolean;
  date: string;
  entries: FoodEntry[];
  onClose: () => void;
  onEntryPress: (entry: FoodEntry) => void;
  onAdd: () => void;
}

function DayListModal({ visible, date, entries, onClose, onEntryPress, onAdd }: DayListModalProps) {
  const dateLabel = format(parseISO(date), 'M月d日 EEEE', { locale: zhCN });
  const totalKcal = entries.reduce((sum, e) => sum + calcKcal(e), 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dayListSheet}>
          <View style={styles.handleBar} />
          <View style={styles.dayListHeader}>
            <Text style={styles.dayListTitle}>{dateLabel}</Text>
            <View style={styles.dayListStats}>
              <Text style={styles.dayListStatText}>{entries.length}餐 · {totalKcal}kcal</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={D.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.dayListContent}>
            {entries.length === 0 ? (
              <View style={styles.dayListEmpty}>
                <Text style={styles.dayListEmptyEmoji}>🍽️</Text>
                <Text style={styles.dayListEmptyText}>这一天还没有记录</Text>
                <Text style={styles.dayListEmptyHint}>点击下方按钮记一餐吧~</Text>
              </View>
            ) : (
              entries.map((entry) => {
                const meta = MEAL_META[entry.meal];
                const kcal = calcKcal(entry);
                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.dayListItem}
                    onPress={() => onEntryPress(entry)}
                    activeOpacity={0.7}
                  >
                    {entry.image ? (
                      <Image source={{ uri: entry.image }} style={styles.dayListThumb} resizeMode="cover" />
                    ) : (
                      <View style={styles.dayListEmojiBox}>
                        <Text style={styles.dayListEmoji}>{meta.emoji}</Text>
                      </View>
                    )}
                    <View style={styles.dayListItemContent}>
                      <Text style={styles.dayListItemName}>{entry.name || meta.label}</Text>
                      <Text style={styles.dayListItemMeta}>{meta.label} · {kcal}kcal</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={D.textHint} />
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity style={styles.dayListAddBtn} onPress={onAdd} activeOpacity={0.8}>
            <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
            <Text style={styles.dayListAddText}>记一餐</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: D.pageBg, // #F2F2F7 页面背景
  },

  // 顶部
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 4,
    paddingHorizontal: 16, // 页面边距16px
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: D.textPrimary,
  },
  insightsEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: D.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  insightsEntryText: {
    fontSize: 12,
    color: D.blue,
    fontWeight: '600',
  },

  // 分段控制器容器
  segmentRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  subSegmentRow: {
    alignItems: 'center',
    marginBottom: 16,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  // === 月历 ===
  monthContainer: {
    backgroundColor: D.cardBg, // 白色卡片
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  monthNavBtn: {
    padding: 4,
  },
  monthLabel: {
    fontSize: 14, // 14pt黑色
    fontWeight: '700',
    color: D.textPrimary,
    marginHorizontal: 16,
  },
  refreshBtn: {
    position: 'absolute',
    right: 0,
    padding: 4,
  },
  calWeekDayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 10, // 10-11pt 浅灰#999
    color: D.textHint,
    fontWeight: '600',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1, // 正方形
    padding: 2, // 行列间距2-4px
  },
  dateCellOtherMonth: {
    opacity: 0.35,
  },
  dateThumbWrap: {
    flex: 1,
    alignSelf: 'stretch',
    position: 'relative',
    borderRadius: MONTH_THUMB_RADIUS, // 微小圆角4px
    overflow: 'hidden',
  },
  dateThumb: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: MONTH_THUMB_RADIUS, // 微小圆角4px 几乎直角
    backgroundColor: D.pageBg,
  },
  dateThumbEmoji: {
    backgroundColor: 'rgba(126, 200, 227, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateThumbEmojiText: {
    fontSize: 22,
  },
  dateCountBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: D.cardBg,
  },
  dateCountText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateEmpty: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumber: {
    fontSize: 13,
    color: D.textSecondary,
    fontWeight: '400',
  },
  dateNumberOther: {
    color: D.textHint, // 淡灰色
  },
  dateNumberToday: {
    color: D.blue,
    fontWeight: '800',
  },

  // 上月折叠
  prevMonthToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: D.divider,
  },
  prevMonthLabel: {
    fontSize: 12,
    color: D.textSecondary,
    fontWeight: '500',
  },
  prevMonthGrid: {
    marginTop: 8,
  },

  // === 周列表 ===
  weekListContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  weekRangeText: {
    fontSize: 14, // 14pt
    color: D.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  weekDayRow: {
    backgroundColor: D.cardBg,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  weekDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekDateDot: {
    width: 8,
    height: 8,
    borderRadius: 4, // 小圆点标识
  },
  weekDateLabel: {
    fontSize: 12, // 12pt灰色
    color: D.textSecondary,
    fontWeight: '500',
  },
  weekDateLabelToday: {
    color: D.blue,
    fontWeight: '700',
  },
  weekDayKcal: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },
  weekThumbRow: {
    gap: 8, // 照片间距8px
  },
  weekThumbWrap: {
    position: 'relative',
    borderRadius: WEEK_THUMB_RADIUS,
    overflow: 'hidden',
  },
  weekThumb: {
    width: WEEK_THUMB_W, // 80px
    height: WEEK_THUMB_H, // 60px
    borderRadius: WEEK_THUMB_RADIUS, // 圆角8px
    backgroundColor: D.pageBg,
  },
  weekThumbPast: {
    opacity: 0.5, // 过去日期降低饱和度
  },
  weekThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: WEEK_THUMB_RADIUS,
  },
  weekThumbEmojiBox: {
    backgroundColor: 'rgba(126, 200, 227, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekThumbEmoji: {
    fontSize: 32,
  },
  weekEmpty: {
    height: WEEK_THUMB_H,
    borderRadius: WEEK_THUMB_RADIUS,
    backgroundColor: D.pageBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekEmptyText: {
    fontSize: 12,
    color: D.textHint,
  },

  // === 计划视图 ===
  planContainer: {
    paddingHorizontal: 16,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: D.textPrimary,
  },
  planAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  planAddText: {
    fontSize: 14,
    color: D.blue, // 蓝色文字
    fontWeight: '700',
  },
  planSegmentRow: {
    alignItems: 'center',
    marginBottom: 16,
  },

  // 按天计划
  planDayContainer: {
    gap: 12,
  },
  planEmpty: {
    alignItems: 'center',
    backgroundColor: D.cardBg,
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  planEmptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  planEmptyText: {
    fontSize: 16,
    color: D.textSecondary,
    fontWeight: '500',
  },
  planEmptyHint: {
    fontSize: 12,
    color: D.textHint,
    marginTop: 4,
  },
  planMealSection: {
    backgroundColor: D.cardBg,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  planMealTitle: {
    fontSize: 18,
    color: D.textPrimary,
    fontWeight: '600',
    marginBottom: 8,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  planCheckBtn: {
    padding: 4,
  },
  planItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planItemEmoji: {
    fontSize: 20,
  },
  planItemName: {
    fontSize: 16,
    color: D.textPrimary,
  },
  planItemNameDone: {
    textDecorationLine: 'line-through',
    color: D.textHint,
  },
  planRemoveBtn: {
    padding: 4,
  },

  // 按周计划 - 双列流式
  planWeekContainer: {
    flexDirection: 'row',
    gap: 16, // 列间距16-20px
  },
  planWeekCol: {
    flex: 1,
    gap: 12, // 行间距12-16px
  },
  planWeekCard: {
    backgroundColor: D.cardBg,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  planWeekDateRow: {
    marginBottom: 8,
  },
  planWeekDowLabel: {
    fontSize: 12, // 12pt黑色
    color: D.textPrimary,
    fontWeight: '700',
  },
  planWeekDateSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  planWeekDateLabel: {
    fontSize: 12,
    color: D.textSecondary,
    fontWeight: '500',
  },
  planWeekUnderline: {
    width: 16, // 彩色短下划线
    height: 3,
    borderRadius: 1.5,
  },
  planWeekItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36, // 行高36pt
  },
  planWeekCheckBtn: {
    padding: 2,
  },
  planWeekThumbBox: {
    width: PLAN_THUMB, // 24px圆形缩略图
    height: PLAN_THUMB,
    borderRadius: PLAN_THUMB / 2,
    backgroundColor: 'rgba(126, 200, 227, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planWeekThumbEmoji: {
    fontSize: 14,
  },
  planWeekItemName: {
    fontSize: 13, // 13pt灰色
    color: D.textSecondary,
    flex: 1,
  },
  planWeekRemoveBtn: {
    padding: 2,
  },
  planWeekEmpty: {
    fontSize: 12,
    color: D.textHint,
    paddingVertical: 6,
  },

  // === FAB ===
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: D.blue,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  fabText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // === 当天清单 Modal ===
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dayListSheet: {
    backgroundColor: D.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  handleBar: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: D.divider,
    alignSelf: 'center',
    marginTop: 8,
  },
  dayListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dayListTitle: {
    fontSize: 18,
    color: D.textPrimary,
    fontWeight: '600',
  },
  dayListStats: {
    flex: 1,
    alignItems: 'center',
  },
  dayListStatText: {
    fontSize: 14,
    color: D.blue,
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: D.pageBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dayListEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  dayListEmptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  dayListEmptyText: {
    fontSize: 16,
    color: D.textSecondary,
  },
  dayListEmptyHint: {
    fontSize: 12,
    color: D.textHint,
    marginTop: 4,
  },
  dayListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
  },
  dayListThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  dayListEmojiBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(126, 200, 227, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayListEmoji: {
    fontSize: 28,
  },
  dayListItemContent: {
    flex: 1,
  },
  dayListItemName: {
    fontSize: 16,
    color: D.textPrimary,
    fontWeight: '500',
  },
  dayListItemMeta: {
    fontSize: 12,
    color: D.textSecondary,
    marginTop: 2,
  },
  dayListAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 12,
    backgroundColor: D.blue,
    borderRadius: 16,
  },
  dayListAddText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  bottomSpacer: {
    height: 100,
  },
});

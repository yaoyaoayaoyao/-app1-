import type { Note, JournalEntry, MoodEntry, FoodEntry, NoteTag } from '@/types';
import { colors } from '@/theme';
import { NOTE_TAG_LABELS } from '@/utils/constants';
import {
  getTodayString,
  getWeekRange,
  getMonthRange,
  addDays,
  formatDate,
} from '@/utils/date';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
  differenceInCalendarDays,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

// === 类型定义 ===

export interface JournalSummaryData {
  /** 手账条数 */
  journalCount: number;
  /** 便签条数 */
  noteCount: number;
  /** 饮食记录条数 */
  foodCount: number;
  /** 照片总数 */
  totalPhotos: number;
  /** 有记录的天数 */
  recordedDays: number;
  /** 该周期总天数 */
  totalDays: number;
  /** 分类统计 */
  categoryStats: { label: string; count: number; color: string }[];
  /** 照片墙 (base64 或 uri 数组) */
  photoWall: string[];
  /** 每日热力图 { date, count } */
  dailyHeatmap: { date: string; count: number }[];
  /** 月度热力图 (仅 year 周期) */
  monthlyHeatmap?: { month: number; count: number }[];
  /** 高光时刻照片 */
  highlightPhoto: string | null;
  /** 心情记录 */
  moodEntries: MoodEntry[];
  /** 温暖文案 */
  highlightText: string;
}

export interface DayDetailData {
  date: string;
  journals: JournalEntry[];
  notes: Note[];
  foodEntries: FoodEntry[];
  mood: MoodEntry | null;
  photos: string[];
}

// === 辅助函数 ===

/** 将时间戳转为日期字符串 YYYY-MM-DD */
function timestampToDate(ts: number): string {
  const d = new Date(ts);
  return formatDate(d);
}

/** 获取便签的分类色 */
function getNoteTagColor(tag: NoteTag): string {
  const colorMap: Record<NoteTag, string> = {
    todo: colors.accentLemon,
    idea: colors.accentWarm,
    diary: colors.accentMint,
    reminder: colors.accentLavender,
    plain: colors.primaryLight,
  };
  return colorMap[tag] || colors.primaryLight;
}

/** 获取手账背景色 */
function getJournalColor(colorIndex: number): string {
  return colors.noteColors[colorIndex] || colors.surface;
}

/** 获取照片来源：手账 imageUri + 饮食记录 image */
function collectPhotos(
  journals: JournalEntry[],
  foods: FoodEntry[]
): string[] {
  const photos: string[] = [];
  journals.forEach((j) => {
    if (j.imageUri) photos.push(j.imageUri);
  });
  foods.forEach((f) => {
    if (f.image) photos.push(f.image);
  });
  return photos;
}

// === 主服务函数 ===

/**
 * 获取手账/便签总结数据
 * @param period 'week' | 'month' | 'year'
 * @param notes 所有便签
 * @param journals 所有手账
 * @param moodEntries 所有心情记录
 * @param foodEntries 所有饮食记录
 */
export function getJournalSummary(
  period: 'week' | 'month' | 'year',
  notes: Note[],
  journals: JournalEntry[],
  moodEntries: MoodEntry[],
  foodEntries: FoodEntry[]
): JournalSummaryData {
  const today = getTodayString();
  const todayDate = parseISO(today);

  let start: Date;
  let end: Date;

  if (period === 'week') {
    start = startOfWeek(todayDate, { weekStartsOn: 1 });
    end = endOfWeek(todayDate, { weekStartsOn: 1 });
  } else if (period === 'month') {
    start = startOfMonth(todayDate);
    end = endOfMonth(todayDate);
  } else {
    start = startOfYear(todayDate);
    end = endOfYear(todayDate);
  }

  const startStr = formatDate(start);
  const endStr = formatDate(end);
  const totalDays = differenceInCalendarDays(end, start) + 1;

  // 筛选该周期内的便签 (按 createdAt 时间戳转日期)
  const periodNotes = notes.filter((n) => {
    const d = timestampToDate(n.createdAt);
    return d >= startStr && d <= endStr;
  });

  // 筛选该周期内的手账 (按 date 字段)
  const periodJournals = journals.filter((j) => {
    return j.date >= startStr && j.date <= endStr;
  });

  // 筛选该周期内的饮食记录
  const periodFoods = foodEntries.filter((f) => {
    return f.date >= startStr && f.date <= endStr;
  });

  // 筛选该周期内的心情记录
  const periodMoods = moodEntries.filter((m) => {
    return m.date >= startStr && m.date <= endStr;
  });

  // 照片总数
  const photos = collectPhotos(periodJournals, periodFoods);
  const totalPhotos = photos.length;

  // 记录天数
  const dateSet = new Set<string>();
  periodNotes.forEach((n) => dateSet.add(timestampToDate(n.createdAt)));
  periodJournals.forEach((j) => dateSet.add(j.date));
  periodFoods.forEach((f) => dateSet.add(f.date));
  periodMoods.forEach((m) => dateSet.add(m.date));
  const recordedDays = dateSet.size;

  // 分类统计
  const categoryMap: Record<string, { count: number; color: string }> = {};
  periodJournals.forEach((j) => {
    const label = '手账';
    if (!categoryMap[label]) {
      categoryMap[label] = { count: 0, color: getJournalColor(j.colorIndex) };
    }
    categoryMap[label].count++;
  });
  periodNotes.forEach((n) => {
    const label = NOTE_TAG_LABELS[n.tag] || '便签';
    const color = getNoteTagColor(n.tag);
    if (!categoryMap[label]) {
      categoryMap[label] = { count: 0, color };
    }
    categoryMap[label].count++;
  });
  const categoryStats = Object.entries(categoryMap)
    .map(([label, { count, color }]) => ({ label, count, color }))
    .sort((a, b) => b.count - a.count);

  // 每日热力图
  const dailyHeatmap: { date: string; count: number }[] = [];
  if (period === 'year') {
    // 年度：按月聚合
    const months = eachMonthOfInterval({ start, end });
    const monthlyHeatmap = months.map((m) => {
      const monthNum = m.getMonth() + 1;
      const monthStr = format(m, 'yyyy-MM');
      let count = 0;
      periodNotes.forEach((n) => {
        if (timestampToDate(n.createdAt).startsWith(monthStr)) count++;
      });
      periodJournals.forEach((j) => {
        if (j.date.startsWith(monthStr)) count++;
      });
      periodFoods.forEach((f) => {
        if (f.date.startsWith(monthStr)) count++;
      });
      return { month: monthNum, count };
    });
    // 每日热力图也填充（用于年度热力格子）
    const allDays = eachDayOfInterval({ start, end });
    allDays.forEach((d) => {
      const dStr = formatDate(d);
      let count = 0;
      periodNotes.forEach((n) => {
        if (timestampToDate(n.createdAt) === dStr) count++;
      });
      periodJournals.forEach((j) => {
        if (j.date === dStr) count++;
      });
      periodFoods.forEach((f) => {
        if (f.date === dStr) count++;
      });
      dailyHeatmap.push({ date: dStr, count });
    });

    return {
      journalCount: periodJournals.length,
      noteCount: periodNotes.length,
      foodCount: periodFoods.length,
      totalPhotos,
      recordedDays,
      totalDays,
      categoryStats,
      photoWall: photos.slice(0, 12),
      dailyHeatmap,
      monthlyHeatmap,
      highlightPhoto: photos[0] || null,
      moodEntries: periodMoods,
      highlightText: buildYearHighlightText(recordedDays, totalPhotos, periodJournals.length, periodNotes.length),
    };
  }

  // 周和月：每日热力图
  const allDays = eachDayOfInterval({ start, end });
  allDays.forEach((d) => {
    const dStr = formatDate(d);
    let count = 0;
    periodNotes.forEach((n) => {
      if (timestampToDate(n.createdAt) === dStr) count++;
    });
    periodJournals.forEach((j) => {
      if (j.date === dStr) count++;
    });
    periodFoods.forEach((f) => {
      if (f.date === dStr) count++;
    });
    dailyHeatmap.push({ date: dStr, count });
  });

  const highlightText =
    period === 'week'
      ? buildWeekHighlightText(recordedDays, totalPhotos, periodJournals.length, periodNotes.length)
      : buildMonthHighlightText(recordedDays, totalDays, totalPhotos, periodJournals.length);

  return {
    journalCount: periodJournals.length,
    noteCount: periodNotes.length,
    foodCount: periodFoods.length,
    totalPhotos,
    recordedDays,
    totalDays,
    categoryStats,
    photoWall: photos.slice(0, 9),
    dailyHeatmap,
    highlightPhoto: photos[0] || null,
    moodEntries: periodMoods,
    highlightText,
  };
}

/**
 * 获取某天的所有记录详情
 */
export function getDayDetail(
  date: string,
  notes: Note[],
  journals: JournalEntry[],
  moodEntries: MoodEntry[],
  foodEntries: FoodEntry[]
): DayDetailData {
  const dayJournals = journals.filter((j) => j.date === date);
  const dayNotes = notes.filter((n) => timestampToDate(n.createdAt) === date);
  const dayFoods = foodEntries.filter((f) => f.date === date);
  const mood = moodEntries.find((m) => m.date === date) || null;

  const photos: string[] = [];
  dayJournals.forEach((j) => {
    if (j.imageUri) photos.push(j.imageUri);
  });
  dayFoods.forEach((f) => {
    if (f.image) photos.push(f.image);
  });

  return {
    date,
    journals: dayJournals,
    notes: dayNotes,
    foodEntries: dayFoods,
    mood,
    photos,
  };
}

// === 温暖文案生成 ===

function buildWeekHighlightText(
  recordedDays: number,
  photos: number,
  journals: number,
  notes: number
): string {
  if (recordedDays === 0) return '这一周还没开始记录呢，翻开新的一页吧~';
  if (recordedDays >= 6) return `这一周几乎天天都有记录，${journals + notes}条美好被你留住了~`;
  if (recordedDays >= 3) return `本周已记录${recordedDays}天，拍了${photos}张照片，继续加油！`;
  return `本周记录了${recordedDays}天，每一条都是珍贵的回忆~`;
}

function buildMonthHighlightText(
  recordedDays: number,
  totalDays: number,
  photos: number,
  journals: number
): string {
  if (recordedDays === 0) return '这个月还是空白的，快来写下第一笔吧~';
  const ratio = recordedDays / totalDays;
  if (ratio >= 0.8) return `这个月记录了${recordedDays}天，几乎每天都不曾缺席，太棒啦！`;
  if (ratio >= 0.5) return `本月已记录${recordedDays}天，${journals}篇手账，记录让生活更丰盈~`;
  return `这个月记录了${recordedDays}天，拍了${photos}张照片，每一个瞬间都值得珍藏~`;
}

function buildYearHighlightText(
  recordedDays: number,
  photos: number,
  journals: number,
  notes: number
): string {
  if (recordedDays === 0) return '这一年还没开始记录呢，让玉桂狗陪你写下第一个故事吧~';
  if (recordedDays >= 300) return `这一年你记录了${recordedDays}个美好瞬间，每一天都没有辜负！`;
  if (recordedDays >= 100) return `这一年，你记录了${recordedDays}天，留下了${photos}张照片，${journals}篇手账，都是珍贵的时光~`;
  if (recordedDays >= 30) return `这一年记录了${recordedDays}天，每一个记录都是与自己的对话~`;
  return `这一年记录了${recordedDays}天，开了个美好的头，继续记录下去吧~`;
}

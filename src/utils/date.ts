import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  isSameDay as fnsSameDay,
  addDays as addDaysFns,
  differenceInCalendarDays,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 将 Date 对象格式化为 YYYY-MM-DD 字符串
 */
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
export function getTodayString(): string {
  return formatDate(new Date());
}

/**
 * 计算连续打卡天数
 * @param dates 已打卡的日期字符串数组
 * @param today 今天的日期字符串
 * @returns 连续打卡天数
 */
export function calculateStreak(dates: string[], today: string): number {
  if (dates.length === 0) return 0;

  const uniqueDates = [...new Set(dates)].sort().reverse();
  let streak = 0;
  let currentDate = today;

  for (const date of uniqueDates) {
    if (date === currentDate) {
      streak++;
      currentDate = addDays(currentDate, -1);
    } else if (date < currentDate) {
      break;
    }
  }

  return streak;
}

/**
 * 获取连续日期列表
 * @param days 天数
 * @param endDate 结束日期
 * @returns 从早到晚的日期字符串数组
 */
export function getStreakDates(days: number, endDate: string): string[] {
  const result: string[] = [];
  for (let i = 0; i < days; i++) {
    result.push(addDays(endDate, -i));
  }
  return result.reverse();
}

/**
 * 获取日期所在周的起止日期 (周一至周日)
 * @param dateStr 日期字符串
 * @returns [开始日期, 结束日期]
 */
export function getWeekRange(dateStr: string): [string, string] {
  const date = parseISO(dateStr);
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return [formatDate(start), formatDate(end)];
}

/**
 * 获取日期所在月的起止日期
 * @param dateStr 日期字符串
 * @returns [开始日期, 结束日期]
 */
export function getMonthRange(dateStr: string): [string, string] {
  const date = parseISO(dateStr);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return [formatDate(start), formatDate(end)];
}

/**
 * 判断两个日期字符串是否为同一天
 */
export function isSameDay(dateStr1: string, dateStr2: string): boolean {
  return fnsSameDay(parseISO(dateStr1), parseISO(dateStr2));
}

/**
 * 日期加减天数
 * @param dateStr 日期字符串
 * @param days 天数 (正数加, 负数减)
 * @returns 新的日期字符串
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseISO(dateStr);
  return formatDate(addDaysFns(date, days));
}

/**
 * 获取相对日期描述
 * @param dateStr 日期字符串
 * @returns 今天/昨天/前天/N天前/M月d日
 */
export function getRelativeLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  const today = new Date();
  const diffDays = differenceInCalendarDays(today, date);

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays === 2) return '前天';
  if (diffDays < 7) return `${diffDays}天前`;
  return format(date, 'M月d日', { locale: zhCN });
}

import { colors } from '@/theme';

/**
 * 各习惯分类的图标列表
 * 使用 MaterialCommunityIcons 图标名
 */
export const HABIT_ICONS: Record<string, string[]> = {
  health: ['water', 'heart-pulse', 'medical-bag', 'pill', 'apple'],
  study: ['book-open-variant', 'school', 'translate', 'pencil', 'laptop'],
  life: ['home', 'broom', 'silverware-fork-knife', 'sleep', 'emoticon-happy'],
  exercise: ['run', 'dumbbell', 'bike', 'swim', 'yoga'],
  custom: ['star-four-points', 'bell', 'calendar-check', 'flag', 'fire'],
};

/**
 * 习惯分类标签
 */
export const HABIT_CATEGORY_LABELS: Record<string, string> = {
  health: '健康',
  study: '学习',
  life: '生活',
  exercise: '运动',
  custom: '自定义',
};

/**
 * 便签标签
 */
export const NOTE_TAG_LABELS: Record<string, string> = {
  todo: '待办',
  idea: '灵感',
  diary: '日记',
  reminder: '提醒',
  plain: '普通',
};

/**
 * 心情选项
 */
export const MOOD_OPTIONS = [
  { key: 'great', icon: 'emoticon-excited', color: colors.success, label: '超棒' },
  { key: 'good', icon: 'emoticon-happy', color: colors.accentMint, label: '不错' },
  { key: 'okay', icon: 'emoticon-neutral', color: colors.accentLemon, label: '一般' },
  { key: 'tired', icon: 'emoticon-sad', color: colors.accentWarm, label: '累了' },
] as const;

/**
 * 应用常量
 */
export const MAX_HABITS = 20;
export const MAX_NOTES = 200;
export const MAX_CHECKIN_NOTE_LENGTH = 200;
export const MAX_NOTE_CONTENT_LENGTH = 5000;
export const PARTNER_CODE_LENGTH = 6;

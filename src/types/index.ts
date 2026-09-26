// === 认证相关 ===
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  avatarColor: string;  // 玉桂狗主题头像色
  partnerId: string | null;  // 搭档的uid
  partnerCode: string;  // 邀请码
  createdAt: number;
}

// === 打卡相关 ===
export type CheckInCategory = 'health' | 'study' | 'life' | 'exercise' | 'custom';

// 习惯模式：必做 = 计入"必须完成"总进度；记录 = 仅记录今天有没有干，不计入必做进度
export type HabitMode = 'required' | 'record';

export interface Habit {
  id: string;
  userId: string;
  title: string;
  category: CheckInCategory;
  icon: string;          // MaterialCommunityIcons name
  color: string;         // 来自 noteColors
  targetDays: number;    // 目标连续天数
  reminderTime: string | null;  // "09:00" 格式
  mode: HabitMode;       // 必做 / 记录（老数据缺省按 required 处理）
  createdAt: number;
  archived: boolean;
}

export interface CheckInRecord {
  id: string;
  habitId: string;
  userId: string;
  date: string;          // "2026-09-13" 格式
  completed: boolean;
  note: string | null;   // 打卡备注
  mood: 'great' | 'good' | 'okay' | 'tired' | null;
  createdAt: number;
}

export interface CheckInStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string | null;
  totalCheckIns: number;
}

// === 便签相关 ===
export type NoteTag = 'todo' | 'idea' | 'diary' | 'reminder' | 'plain';

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  colorIndex: number;    // noteColors 索引
  tag: NoteTag;
  pinned: boolean;
  checklistItems: ChecklistItem[] | null;  // todo类型便签的清单项
  createdAt: number;
  updatedAt: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

// === 搭档联机相关 ===
export type PartnerStatus = 'online' | 'offline' | 'busy';

export interface PartnerLink {
  id: string;
  userAId: string;
  userBId: string;
  linkedAt: number;
  status: 'active' | 'pending' | 'severed';
}

export interface PartnerActivity {
  userId: string;
  displayName: string;
  avatarColor: string;
  status: PartnerStatus;
  lastSeen: number;
  todayCheckIns: number;
  todayCheckInDetails: { habitTitle: string; completed: boolean; category: CheckInCategory }[];
  todayNoteCount: number;
  currentStreak: number;
  mood: string | null;
}

// === AI总结相关 ===
export type SummaryPeriod = 'daily' | 'weekly' | 'monthly';

export interface SummaryRequest {
  userId: string;
  period: SummaryPeriod;
  startDate: string;
  endDate: string;
}

export interface SummaryResult {
  id: string;
  userId: string;
  period: SummaryPeriod;
  startDate: string;
  endDate: string;
  content: string;        // Markdown格式总结内容
  highlights: string[];   // 关键亮点
  mood: string;           // AI分析的情绪
  suggestions: string[];  // AI建议
  partnerSummary: string | null;  // 如果有搭档，包含搭档的对比总结
  createdAt: number;
}

// === 吉祥物形象 ===
export type MascotType = 'cinnamoroll' | 'upload';
export type MascotExpression = 'happy' | 'sleepy' | 'excited' | 'sad' | 'shy' | 'angry' | 'love';

// 部位形状
export type HeadShape = 'round' | 'square' | 'oval';
export type BodyShape = 'round' | 'plump' | 'slim';
export type EarShape = 'long' | 'round' | 'short';
// 部位大小
export type PartSize = 'small' | 'medium' | 'large';

export interface MascotConfig {
  type: MascotType;
  // 玉桂狗模式
  expression: MascotExpression;
  bodyColor: string;
  cheekColor: string;
  earColor: string;
  // 形状与大小（脑袋 / 身体 / 耳朵）
  headShape: HeadShape;
  headSize: PartSize;
  bodyShape: BodyShape;
  bodySize: PartSize;
  earShape: EarShape;
  earSize: PartSize;
  // 上传模式
  customImageUri: string | null;
  // 通用
  size: number; // 默认大小系数
}

// === 心情日记 ===
export type MoodType = 'happy' | 'calm' | 'tired' | 'sad' | 'excited' | 'angry';

export interface MoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mood: MoodType;
  content: string; // 一句话心情日记
  createdAt: number;
}

// === 手账 ===
export interface Sticker {
  id: string;
  type: 'emoji' | 'shape' | 'custom';
  content: string;
  x: number; // 百分比位置 0-100
  y: number;
  scale: number;
  rotation: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  imageUri: string | null; // base64
  stickers: Sticker[];
  colorIndex: number; // 背景色索引
  createdAt: number;
  updatedAt: number;
}

// === 饮食记录 ===
export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodEntry {
  id: string;
  date: string;          // yyyy-MM-dd
  meal: Meal;
  name: string;
  kcal?: number;
  carbs?: number;        // 碳水 g
  fat?: number;          // 脂肪 g
  protein?: number;      // 蛋白质 g
  portion?: number;      // 分量 g
  image: string;         // base64 或空字符串
  frame: string;         // 边框样式 id
  createdAt: number;
}

export interface MealPlanItem {
  id: string;
  date: string;          // yyyy-MM-dd
  meal: Meal;
  name: string;
  emoji: string;
  done: boolean;
  sortOrder: number;
}

export interface FoodInsights {
  recordedDays: number;
  totalMeals: number;
  daysWithKcal: number;
  totalKcal: number;
  avgKcal: number;
  topFoods: { name: string; count: number }[];
  mealCounts: { breakfast: number; lunch: number; dinner: number; snack: number };
  streak: number;
  carbsKcal: number;
  fatKcal: number;
  proteinKcal: number;
  headline: string;
  tips: string[];
}

// === 通用 ===
export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  lastCursor: string | null;
}

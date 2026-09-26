export interface Theme {
  id: string;
  name: string;
  description: string;
  // 背景色
  background: string;
  surface: string;        // 卡片背景
  surfaceVariant: string; // 次级背景
  // 主色
  primary: string;
  primaryLight: string;
  primaryDark: string;
  // 强调色
  accent: string;
  accentWarm: string;
  accentMint: string;
  accentLavender: string;
  accentLemon: string;
  // 文字
  textPrimary: string;
  textSecondary: string;
  textHint: string;
  textOnPrimary: string;
  // 边框
  border: string;
  // 渐变
  gradientStart: string;
  gradientEnd: string;
  // 卡片阴影
  shadowColor: string;
  shadowOpacity: number;
}

// 1. 玉桂狗蓝（默认）：天空蓝+云朵白，经典玉桂狗风格
const cinnamoroll: Theme = {
  id: 'cinnamoroll',
  name: '玉桂狗蓝',
  description: '天空蓝+云朵白，经典玉桂狗风格',
  background: '#F0F8FF',
  surface: '#FFFFFF',
  surfaceVariant: '#E8F4FD',
  primary: '#5B9BD5',
  primaryLight: '#A8C8E8',
  primaryDark: '#3A7AB5',
  accent: '#FFB5C5',
  accentWarm: '#FFB5C5',
  accentMint: '#A8E6CF',
  accentLavender: '#C3B1E1',
  accentLemon: '#FFF5BA',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  textHint: '#BDC3C7',
  textOnPrimary: '#FFFFFF',
  border: '#E0E7EE',
  gradientStart: '#E3F2FD',
  gradientEnd: '#F0F8FF',
  shadowColor: '#5B9BD5',
  shadowOpacity: 0.1,
};

// 2. 薄荷疗愈：薄荷绿+奶油色，温暖治愈系
const mintHealing: Theme = {
  id: 'mint-healing',
  name: '薄荷疗愈',
  description: '薄荷绿+奶油色，温暖治愈系',
  background: '#F7F6F2',
  surface: '#FFFFFF',
  surfaceVariant: '#EDEDE5',
  primary: '#9DB89D',
  primaryLight: '#C5D5C0',
  primaryDark: '#7DA87D',
  accent: '#E8A598',
  accentWarm: '#E8A598',
  accentMint: '#A8C5A8',
  accentLavender: '#C5B8C5',
  accentLemon: '#E8E0C4',
  textPrimary: '#2C2C2C',
  textSecondary: '#8E8E93',
  textHint: '#C7C7CC',
  textOnPrimary: '#FFFFFF',
  border: '#E5E5E0',
  gradientStart: '#E8F0E8',
  gradientEnd: '#F7F6F2',
  shadowColor: '#9DB89D',
  shadowOpacity: 0.12,
};

// 3. 极简黑白：黑白+奶油底，干净利落
const minimalMono: Theme = {
  id: 'minimal-mono',
  name: '极简黑白',
  description: '黑白+奶油底，干净利落',
  background: '#F5F5F0',
  surface: '#FFFFFF',
  surfaceVariant: '#E8E8E0',
  primary: '#1A1A1A',
  primaryLight: '#4A4A4A',
  primaryDark: '#000000',
  accent: '#E8A598',
  accentWarm: '#E8A598',
  accentMint: '#A8C5A8',
  accentLavender: '#C5C5C5',
  accentLemon: '#E0E0D0',
  textPrimary: '#1A1A1A',
  textSecondary: '#868686',
  textHint: '#C0C0C0',
  textOnPrimary: '#FFFFFF',
  border: '#E0E0E0',
  gradientStart: '#F0F0EB',
  gradientEnd: '#F5F5F0',
  shadowColor: '#1A1A1A',
  shadowOpacity: 0.06,
};

// 4. 生活日历：米白纸质底+棕色，手帐感
const lifeJournal: Theme = {
  id: 'life-journal',
  name: '生活日历',
  description: '米白纸质底+棕色，手帐感',
  background: '#F5F0EB',
  surface: '#FFFEFA',
  surfaceVariant: '#EDE5D8',
  primary: '#8B6F47',
  primaryLight: '#C4A47A',
  primaryDark: '#5C4A30',
  accent: '#D4765C',
  accentWarm: '#D4765C',
  accentMint: '#9DAF8E',
  accentLavender: '#B8A8C5',
  accentLemon: '#E0DCC0',
  textPrimary: '#3A2E20',
  textSecondary: '#8B7E6A',
  textHint: '#C4B8A4',
  textOnPrimary: '#FFFFFF',
  border: '#E0D5C0',
  gradientStart: '#EDE5D8',
  gradientEnd: '#F5F0EB',
  shadowColor: '#8B6F47',
  shadowOpacity: 0.1,
};

export const themes: Theme[] = [
  cinnamoroll,
  mintHealing,
  minimalMono,
  lifeJournal,
];

export const defaultTheme = cinnamoroll;

export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) || defaultTheme;
}

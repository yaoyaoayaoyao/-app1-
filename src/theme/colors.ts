export const colors = {
  // 玉桂狗主色系 - 天空蓝
  primary: '#7EC8E3',
  primaryLight: '#B8E0F5',
  primaryDark: '#5BA8C9',

  // 背景 - 云朵白
  background: '#F7FBFE',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F7FC',

  // 强调色 - 暖粉(打卡成功)、薄荷绿(便签)
  accentWarm: '#FFB5C5',
  accentMint: '#A8E6CF',
  accentLavender: '#C3B1E1',
  accentLemon: '#FFF5BA',

  // 文字
  textPrimary: '#3A4A5C',
  textSecondary: '#7A8A9C',
  textHint: '#B0BEC5',
  textOnPrimary: '#FFFFFF',

  // 功能色
  success: '#66BB6A',
  warning: '#FFA726',
  error: '#EF5350',
  info: '#42A5F5',

  // 边框/分割
  border: '#E1E8ED',
  divider: '#EEF2F5',

  // 便签颜色 (6种)
  noteColors: [
    '#FFF5BA', // 柠檬黄
    '#FFB5C5', // 樱花粉
    '#A8E6CF', // 薄荷绿
    '#B8E0F5', // 天空蓝
    '#C3B1E1', // 薰衣草紫
    '#FFD8A8', // 蜜桃橙
  ],
} as const;

export const gradients = {
  // 天空渐变 - 首页背景
  sky: ['#E8F4FD', '#B8E0F5'],
  // 日出渐变 - 打卡页
  sunrise: ['#FFF5BA', '#FFB5C5'],
  // 薄荷渐变 - 便签页
  mint: ['#A8E6CF', '#7EC8E3'],
  // 紫梦渐变 - 总结页
  lavender: ['#C3B1E1', '#B8E0F5'],
} as const;

export type AppTheme = {
  colors: typeof colors;
  gradients: typeof gradients;
};

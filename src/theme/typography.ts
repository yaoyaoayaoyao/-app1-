import { Platform } from 'react-native';

export const typography = {
  // 标题
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: 0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: 0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const },

  // 正文
  body1: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },

  // 辅助
  caption: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.2 },

  // 特殊
  buttonLabel: { fontSize: 16, fontWeight: '600' as const },
  streakNumber: { fontSize: 32, fontWeight: '800' as const },
} as const;

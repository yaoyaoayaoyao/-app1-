import { colors, gradients } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows } from './spacing';
import { themes, defaultTheme, getThemeById } from './themes';

export { colors, gradients } from './colors';
export { typography } from './typography';
export { spacing, borderRadius, shadows } from './spacing';
export { themes, defaultTheme, getThemeById } from './themes';

export const theme = {
  colors,
  gradients,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export type { AppTheme } from './colors';
export type { Theme } from './themes';
export default theme;

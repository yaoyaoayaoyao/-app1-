import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, defaultTheme, getThemeById, type Theme } from '@/theme/themes';

export type BackgroundType = 'gradient' | 'color' | 'image';

interface ThemeState {
  themeId: string;
  currentTheme: Theme;
  themes: Theme[];

  // 背景配置
  backgroundType: BackgroundType;
  backgroundImage: string | null;
  backgroundOpacity: number;

  setTheme: (themeId: string) => void;
  setBackgroundType: (type: BackgroundType) => void;
  setBackgroundImage: (base64: string | null) => void;
  setBackgroundOpacity: (opacity: number) => void;
  resetBackground: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeId: defaultTheme.id,
      currentTheme: defaultTheme,
      themes,

      // 背景配置默认值
      backgroundType: 'gradient',
      backgroundImage: null,
      backgroundOpacity: 0.3,

      setTheme: (themeId) => {
        const theme = getThemeById(themeId);
        set({ themeId, currentTheme: theme });
      },

      setBackgroundType: (type) => {
        set({ backgroundType: type });
      },

      setBackgroundImage: (base64) => {
        set({ backgroundImage: base64 });
      },

      setBackgroundOpacity: (opacity) => {
        set({ backgroundOpacity: Math.max(0, Math.min(1, opacity)) });
      },

      resetBackground: () => {
        set({
          backgroundType: 'gradient',
          backgroundImage: null,
          backgroundOpacity: 0.3,
        });
      },
    }),
    {
      name: 'cinnamoroll-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeId: state.themeId,
        backgroundType: state.backgroundType,
        backgroundImage: state.backgroundImage,
        backgroundOpacity: state.backgroundOpacity,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const theme = getThemeById(state.themeId);
          state.currentTheme = theme;
          // 确保背景配置有合理默认值
          if (!state.backgroundType) state.backgroundType = 'gradient';
          if (state.backgroundOpacity === undefined || state.backgroundOpacity === null) {
            state.backgroundOpacity = 0.3;
          }
        }
      },
    },
  ),
);

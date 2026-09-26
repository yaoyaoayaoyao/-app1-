import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MascotConfig, MascotExpression } from '@/types';

const defaultMascotConfig: MascotConfig = {
  type: 'cinnamoroll',
  expression: 'happy',
  bodyColor: '#FFFFFF',
  cheekColor: '#FFB5C5',
  earColor: '#F0F7FC',
  headShape: 'round',
  headSize: 'medium',
  bodyShape: 'round',
  bodySize: 'medium',
  earShape: 'long',
  earSize: 'medium',
  customImageUri: null,
  size: 1,
};

interface MascotState {
  mascotConfig: MascotConfig;

  setMascotConfig: (config: Partial<MascotConfig>) => void;
  setExpression: (expression: MascotExpression) => void;
  setCustomImage: (uri: string | null) => void;
  resetMascot: () => void;
}

export const useMascotStore = create<MascotState>()(
  persist(
    (set, get) => ({
      mascotConfig: { ...defaultMascotConfig },

      setMascotConfig: (config) => {
        set((state) => ({
          mascotConfig: { ...state.mascotConfig, ...config },
        }));
      },

      setExpression: (expression) => {
        set((state) => ({
          mascotConfig: { ...state.mascotConfig, expression },
        }));
      },

      setCustomImage: (uri) => {
        set((state) => ({
          mascotConfig: {
            ...state.mascotConfig,
            customImageUri: uri,
            type: uri ? 'upload' : 'cinnamoroll',
          },
        }));
      },

      resetMascot: () => {
        set({ mascotConfig: { ...defaultMascotConfig } });
      },
    }),
    {
      name: 'cinnamoroll-mascot',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mascotConfig: state.mascotConfig }),
    },
  ),
);

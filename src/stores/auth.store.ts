import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppUser } from '@/types';
import { colors } from '@/theme';
import { generateId, generatePartnerCode } from '@/utils/id';

const AVATAR_COLORS = [
  colors.accentWarm,
  colors.accentMint,
  colors.accentLavender,
  colors.accentLemon,
  colors.primary,
  colors.primaryLight,
];

function createDefaultUser(): AppUser {
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  return {
    uid: generateId(),
    email: '',
    displayName: '玉桂狗',
    avatarColor,
    partnerId: null,
    partnerCode: generatePartnerCode(),
    createdAt: Date.now(),
  };
}

interface AuthState {
  user: AppUser | null;
  initialized: boolean;

  initUser: () => void;
  updateProfile: (updates: Partial<Pick<AppUser, 'displayName' | 'avatarColor'>>) => void;
  clearAll: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      initialized: false,

      initUser: () => {
        const { user } = get();
        if (!user) {
          const newUser = createDefaultUser();
          set({ user: newUser, initialized: true });
        } else {
          set({ initialized: true });
        }
      },

      updateProfile: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      clearAll: () => {
        set({ user: null, initialized: false });
      },
    }),
    {
      name: 'cinnamoroll-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

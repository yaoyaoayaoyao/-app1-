import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MoodEntry, MoodType } from '@/types';
import { generateId } from '@/utils/id';
import { getTodayString, getMonthRange } from '@/utils/date';

interface MoodState {
  entries: MoodEntry[];
  customIcons: Record<MoodType, string | null>;

  addEntry: (mood: MoodType, content: string, date?: string) => MoodEntry;
  getTodayEntry: () => MoodEntry | null;
  getMoodForDate: (date: string) => MoodEntry | null;
  getMonthEntries: (year: number, month: number) => MoodEntry[];
  getMoodStats: (year?: number, month?: number) => Record<MoodType, number>;
  deleteEntry: (id: string) => void;
  clearAllData: () => void;
  setCustomIcon: (mood: MoodType, base64: string) => void;
  resetCustomIcon: (mood: MoodType) => void;
  resetAllCustomIcons: () => void;
}

const defaultCustomIcons: Record<MoodType, string | null> = {
  happy: null,
  calm: null,
  tired: null,
  sad: null,
  excited: null,
  angry: null,
};

const defaultStats: Record<MoodType, number> = {
  happy: 0,
  calm: 0,
  tired: 0,
  sad: 0,
  excited: 0,
  angry: 0,
};

export const useMoodStore = create<MoodState>()(
  persist(
    (set, get) => ({
      entries: [],
      customIcons: { ...defaultCustomIcons },

      addEntry: (mood, content, date) => {
        const targetDate = date || getTodayString();
        const now = Date.now();
        const existing = get().entries.find((e) => e.date === targetDate);

        if (existing) {
          // 更新今日心情
          set((state) => ({
            entries: state.entries.map((e) =>
              e.id === existing.id ? { ...e, mood, content, createdAt: now } : e
            ),
          }));
          return { ...existing, mood, content, createdAt: now };
        }

        const newEntry: MoodEntry = {
          id: generateId(),
          date: targetDate,
          mood,
          content,
          createdAt: now,
        };

        set((state) => ({
          entries: [...state.entries, newEntry].sort(
            (a, b) => b.createdAt - a.createdAt
          ),
        }));

        return newEntry;
      },

      getTodayEntry: () => {
        const today = getTodayString();
        return get().entries.find((e) => e.date === today) || null;
      },

      getMoodForDate: (date) => {
        return get().entries.find((e) => e.date === date) || null;
      },

      getMonthEntries: (year, month) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const [monthStart, monthEnd] = getMonthRange(dateStr);
        return get().entries.filter((e) => e.date >= monthStart && e.date <= monthEnd);
      },

      getMoodStats: (year, month) => {
        let entries: MoodEntry[];
        if (year !== undefined && month !== undefined) {
          entries = get().getMonthEntries(year, month);
        } else {
          entries = get().entries;
        }

        const stats: Record<MoodType, number> = { ...defaultStats };
        entries.forEach((e) => {
          stats[e.mood] = (stats[e.mood] || 0) + 1;
        });
        return stats;
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },

      clearAllData: () => {
        set({ entries: [] });
      },

      setCustomIcon: (mood, base64) => {
        set((state) => ({
          customIcons: { ...state.customIcons, [mood]: base64 },
        }));
      },

      resetCustomIcon: (mood) => {
        set((state) => ({
          customIcons: { ...state.customIcons, [mood]: null },
        }));
      },

      resetAllCustomIcons: () => {
        set({ customIcons: { ...defaultCustomIcons } });
      },
    }),
    {
      name: 'cinnamoroll-mood',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ entries: state.entries, customIcons: state.customIcons }),
    },
  ),
);

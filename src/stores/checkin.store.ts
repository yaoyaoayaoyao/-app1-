import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit, CheckInRecord, CheckInStreak, HabitMode } from '@/types';
import { generateId } from '@/utils/id';
import { getTodayString, calculateStreak } from '@/utils/date';

interface CheckInState {
  habits: Habit[];
  checkIns: CheckInRecord[];
  loading: boolean;
  error: string | null;

  // 习惯操作
  addHabit: (habit: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'archived' | 'mode'> & { mode?: HabitMode }) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => void;
  archiveHabit: (habitId: string) => void;

  // 打卡操作
  toggleToday: (habitId: string, note: string | null, mood: CheckInRecord['mood']) => Promise<void>;
  isHabitCheckedToday: (habitId: string) => boolean;
  getTodayCheckIns: () => CheckInRecord[];
  // 今日进度按模式拆分（必做 / 记录），老数据缺省算必做
  getTodayProgress: () => {
    required: { done: number; total: number };
    record: { done: number; total: number };
  };
  getCheckInDates: (habitId: string) => string[];
  getCheckInStreak: (habitId: string) => CheckInStreak;
  getMonthCheckInMap: (habitId: string, year: number, month: number) => Record<string, boolean>;

  // 数据管理
  importSeedData: (habits: Habit[], checkIns: CheckInRecord[]) => void;
  clearAllData: () => void;
  setError: (error: string | null) => void;
}

function calculateLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (Math.round(diff) !== 0) {
      current = 1;
    }
  }
  return longest;
}

export const useCheckInStore = create<CheckInState>()(
  persist(
    (set, get) => ({
      habits: [],
      checkIns: [],
      loading: false,
      error: null,

      // === 习惯操作 ===
      addHabit: async (habitData) => {
        set({ loading: true, error: null });
        try {
          const userId = 'local_user';
          const newHabit: Habit = {
            id: generateId(),
            userId,
            ...habitData,
            mode: habitData.mode ?? 'required',
            createdAt: Date.now(),
            archived: false,
          };
          set((state) => ({
            habits: [...state.habits, newHabit],
            loading: false,
          }));
        } catch (e) {
          set({ error: (e as Error).message, loading: false });
        }
      },

      updateHabit: (habitId, updates) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, ...updates } : h
          ),
        }));
      },

      archiveHabit: (habitId) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, archived: true } : h
          ),
        }));
      },

      // === 打卡操作 ===
      toggleToday: async (habitId, note, mood) => {
        set({ error: null });
        const today = getTodayString();
        const checkInId = `${habitId}_${today}`;

        set((state) => {
          const existingIndex = state.checkIns.findIndex((c) => c.id === checkInId);

          if (existingIndex >= 0) {
            // 切换完成状态
            const updated = [...state.checkIns];
            updated[existingIndex] = {
              ...updated[existingIndex],
              completed: !updated[existingIndex].completed,
              note,
              mood,
              createdAt: Date.now(),
            };
            return { checkIns: updated };
          } else {
            // 新建打卡记录
            const userId = 'local_user';
            const newRecord: CheckInRecord = {
              id: checkInId,
              habitId,
              userId,
              date: today,
              completed: true,
              note,
              mood,
              createdAt: Date.now(),
            };
            return { checkIns: [...state.checkIns, newRecord] };
          }
        });
      },

      isHabitCheckedToday: (habitId) => {
        const today = getTodayString();
        return get().checkIns.some(
          (c) => c.habitId === habitId && c.date === today && c.completed
        );
      },

      getTodayCheckIns: () => {
        const today = getTodayString();
        return get().checkIns.filter((c) => c.date === today && c.completed);
      },

      getTodayProgress: () => {
        const today = getTodayString();
        const doneIds = new Set(
          get()
            .checkIns.filter((c) => c.date === today && c.completed)
            .map((c) => c.habitId)
        );
        const active = get().habits.filter((h) => !h.archived);
        const required = active.filter((h) => h.mode !== 'record');
        const record = active.filter((h) => h.mode === 'record');
        return {
          required: {
            total: required.length,
            done: required.filter((h) => doneIds.has(h.id)).length,
          },
          record: {
            total: record.length,
            done: record.filter((h) => doneIds.has(h.id)).length,
          },
        };
      },

      getCheckInDates: (habitId) => {
        return get()
          .checkIns.filter((c) => c.habitId === habitId && c.completed)
          .map((c) => c.date)
          .sort();
      },

      getCheckInStreak: (habitId) => {
        const dates = get().getCheckInDates(habitId);
        const today = getTodayString();
        const currentStreak = calculateStreak(dates, today);
        const longestStreak = calculateLongestStreak(dates);

        return {
          habitId,
          currentStreak,
          longestStreak,
          lastCheckInDate: dates.length > 0 ? dates[dates.length - 1] : null,
          totalCheckIns: dates.length,
        };
      },

      getMonthCheckInMap: (habitId, year, month) => {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

        const map: Record<string, boolean> = {};
        get()
          .checkIns.filter(
            (c) =>
              c.habitId === habitId &&
              c.date >= startDate &&
              c.date <= endDate &&
              c.completed
          )
          .forEach((c) => {
            map[c.date] = true;
          });
        return map;
      },

      // === 数据管理 ===
      importSeedData: (habits, checkIns) => {
        set({ habits, checkIns });
      },

      clearAllData: () => {
        set({ habits: [], checkIns: [] });
      },

      setError: (error) => set({ error }),
    }),
    {
      name: 'cinnamoroll-checkin',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        habits: state.habits,
        checkIns: state.checkIns,
      }),
    },
  ),
);

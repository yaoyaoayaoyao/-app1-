import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { JournalEntry, Sticker } from '@/types';
import { generateId } from '@/utils/id';
import { getTodayString } from '@/utils/date';

interface JournalState {
  entries: JournalEntry[];

  addEntry: (data: {
    title: string;
    content: string;
    imageUri: string | null;
    stickers: Sticker[];
    colorIndex: number;
    date?: string;
  }) => string;
  editEntry: (id: string, updates: Partial<JournalEntry>) => void;
  removeEntry: (id: string) => void;
  getEntry: (id: string) => JournalEntry | null;
  getEntriesByDate: (date: string) => JournalEntry[];
  clearAllData: () => void;
}

function sortEntries(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => b.updatedAt - a.updatedAt);
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (data) => {
        const userId = 'local_user';
        const now = Date.now();
        const newEntry: JournalEntry = {
          id: generateId(),
          userId,
          date: data.date || getTodayString(),
          title: data.title,
          content: data.content,
          imageUri: data.imageUri,
          stickers: data.stickers,
          colorIndex: data.colorIndex,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          entries: sortEntries([...state.entries, newEntry]),
        }));
        return newEntry.id;
      },

      editEntry: (id, updates) => {
        set((state) => ({
          entries: sortEntries(
            state.entries.map((e) =>
              e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
            )
          ),
        }));
      },

      removeEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },

      getEntry: (id) => {
        return get().entries.find((e) => e.id === id) || null;
      },

      getEntriesByDate: (date) => {
        return get().entries.filter((e) => e.date === date);
      },

      clearAllData: () => {
        set({ entries: [] });
      },
    }),
    {
      name: 'cinnamoroll-journal',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
);

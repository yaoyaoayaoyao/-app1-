import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Note, NoteTag, ChecklistItem } from '@/types';
import { generateId } from '@/utils/id';

interface NotesState {
  notes: Note[];
  loading: boolean;
  error: string | null;

  addNote: (data: {
    title: string;
    content: string;
    colorIndex: number;
    tag: NoteTag;
    checklistItems: ChecklistItem[] | null;
  }) => Promise<string | null>;
  editNote: (id: string, updates: Partial<Note>) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  toggleNotePin: (id: string, pinned: boolean) => Promise<void>;
  updateChecklist: (noteId: string, items: ChecklistItem[]) => void;

  importSeedData: (notes: Note[]) => void;
  clearAllData: () => void;
  setError: (error: string | null) => void;
}

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      loading: false,
      error: null,

      addNote: async (data) => {
        set({ loading: true, error: null });
        try {
          const userId = 'local_user';
          const now = Date.now();
          const newNote: Note = {
            id: generateId(),
            userId,
            title: data.title,
            content: data.content,
            colorIndex: data.colorIndex,
            tag: data.tag,
            pinned: false,
            checklistItems: data.checklistItems,
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({
            notes: sortNotes([...state.notes, newNote]),
            loading: false,
          }));
          return newNote.id;
        } catch (e) {
          set({ error: (e as Error).message, loading: false });
          return null;
        }
      },

      editNote: async (id, updates) => {
        set({ error: null });
        try {
          set((state) => ({
            notes: sortNotes(
              state.notes.map((n) =>
                n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
              )
            ),
          }));
        } catch (e) {
          set({ error: (e as Error).message });
        }
      },

      removeNote: async (id) => {
        set({ error: null });
        try {
          set((state) => ({
            notes: state.notes.filter((n) => n.id !== id),
          }));
        } catch (e) {
          set({ error: (e as Error).message });
        }
      },

      toggleNotePin: async (id, pinned) => {
        try {
          set((state) => ({
            notes: sortNotes(
              state.notes.map((n) =>
                n.id === id ? { ...n, pinned: !pinned, updatedAt: Date.now() } : n
              )
            ),
          }));
        } catch (e) {
          set({ error: (e as Error).message });
        }
      },

      updateChecklist: (noteId, items) => {
        set((state) => ({
          notes: sortNotes(
            state.notes.map((n) =>
              n.id === noteId
                ? { ...n, checklistItems: items, updatedAt: Date.now() }
                : n
            )
          ),
        }));
      },

      importSeedData: (notes) => {
        set({ notes: sortNotes(notes) });
      },

      clearAllData: () => {
        set({ notes: [] });
      },

      setError: (error) => set({ error }),
    }),
    {
      name: 'cinnamoroll-notes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ notes: state.notes }),
    },
  ),
);

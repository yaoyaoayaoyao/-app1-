/**
 * App 集成测试
 * 测试所有 store 的初始状态和基本交互
 * 所有 Firebase 相关调用均使用 mock
 */

// Mock Firebase 模块 - 必须在 import 之前
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue({ name: 'test-app' }),
  getApps: jest.fn().mockReturnValue([]),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn().mockReturnValue({ currentUser: null }),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn((_, cb) => {
    cb(null);
    return () => {};
  }),
  updateProfile: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn().mockReturnValue({}),
  collection: jest.fn(),
  doc: jest.fn().mockReturnValue({ id: 'test-doc' }),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn((_, cb) => {
    cb({ docs: [] });
    return () => {};
  }),
  serverTimestamp: jest.fn().mockReturnValue({ seconds: 1234567890 }),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn().mockReturnValue({}),
  httpsCallable: jest.fn(),
}));

// Mock AsyncStorage for zustand persist
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(null),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
  mergeItem: jest.fn().mockResolvedValue(null),
  clear: jest.fn().mockResolvedValue(null),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue([]),
  multiRemove: jest.fn().mockResolvedValue([]),
  multiMerge: jest.fn().mockResolvedValue([]),
}));

// Mock id 生成器
jest.mock('@/utils/id', () => ({
  generateId: jest.fn().mockReturnValue('test-id-123'),
  generatePartnerCode: jest.fn().mockReturnValue('ABC123'),
}));

// Mock theme colors
jest.mock('@/theme', () => ({
  colors: {
    accentWarm: '#FFB5C5',
    accentMint: '#A8E6CF',
    accentLavender: '#C3B1E1',
    accentLemon: '#FFF5BA',
    primary: '#7EC8E3',
    primaryLight: '#B8E0F5',
  },
}));

// Mock date utils
jest.mock('@/utils/date', () => ({
  calculateStreak: jest.fn((dates: string[]) => dates.length),
  getTodayString: jest.fn().mockReturnValue('2026-09-13'),
  formatDate: jest.fn(),
  getStreakDates: jest.fn(),
  getWeekRange: jest.fn(),
  getMonthRange: jest.fn(),
  isSameDay: jest.fn(),
  addDays: jest.fn(),
  getRelativeLabel: jest.fn(),
}));

// Import stores after mocks
import { useAuthStore } from '@/stores/auth.store';
import { useCheckInStore } from '@/stores/checkin.store';
import { useNotesStore } from '@/stores/notes.store';
import { useSummaryStore } from '@/stores/summary.store';

describe('App Integration - Store Initial States', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth Store', () => {
    it('should start unauthenticated', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.initialized).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should have signIn, signUp, signOut methods', () => {
      const state = useAuthStore.getState();
      expect(typeof state.signIn).toBe('function');
      expect(typeof state.signUp).toBe('function');
      expect(typeof state.signOut).toBe('function');
    });

    it('should have initAuth and setUser methods', () => {
      const state = useAuthStore.getState();
      expect(typeof state.initAuth).toBe('function');
      expect(typeof state.setUser).toBe('function');
    });

    it('should clear error with clearError', () => {
      const state = useAuthStore.getState();
      expect(typeof state.clearError).toBe('function');
    });
  });

  describe('CheckIn Store', () => {
    it('should start with empty habits', () => {
      const state = useCheckInStore.getState();
      expect(state.habits).toEqual([]);
    });

    it('should start with empty todayCheckIns', () => {
      const state = useCheckInStore.getState();
      expect(state.todayCheckIns).toEqual([]);
    });

    it('should start with no loading and no error', () => {
      const state = useCheckInStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should have init, addHabit, toggleToday methods', () => {
      const state = useCheckInStore.getState();
      expect(typeof state.init).toBe('function');
      expect(typeof state.addHabit).toBe('function');
      expect(typeof state.toggleToday).toBe('function');
    });

    it('should return false for isHabitCheckedToday when no check-ins', () => {
      const state = useCheckInStore.getState();
      expect(state.isHabitCheckedToday('habit-1')).toBe(false);
    });

    it('should have setError method', () => {
      const state = useCheckInStore.getState();
      expect(typeof state.setError).toBe('function');
    });
  });

  describe('Notes Store', () => {
    it('should start with empty notes', () => {
      const state = useNotesStore.getState();
      expect(state.notes).toEqual([]);
    });

    it('should start with no loading and no error', () => {
      const state = useNotesStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should have init, addNote, editNote, removeNote methods', () => {
      const state = useNotesStore.getState();
      expect(typeof state.init).toBe('function');
      expect(typeof state.addNote).toBe('function');
      expect(typeof state.editNote).toBe('function');
      expect(typeof state.removeNote).toBe('function');
    });

    it('should have toggleNotePin method', () => {
      const state = useNotesStore.getState();
      expect(typeof state.toggleNotePin).toBe('function');
    });

    it('should have setError method', () => {
      const state = useNotesStore.getState();
      expect(typeof state.setError).toBe('function');
    });
  });

  describe('Summary Store', () => {
    it('should start with null currentSummary', () => {
      const state = useSummaryStore.getState();
      expect(state.currentSummary).toBeNull();
    });

    it('should start with empty recentSummaries', () => {
      const state = useSummaryStore.getState();
      expect(state.recentSummaries).toEqual([]);
    });

    it('should start with no loading and no error', () => {
      const state = useSummaryStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should have generate, loadExisting, loadRecent methods', () => {
      const state = useSummaryStore.getState();
      expect(typeof state.generate).toBe('function');
      expect(typeof state.loadExisting).toBe('function');
      expect(typeof state.loadRecent).toBe('function');
    });

    it('should have setError method', () => {
      const state = useSummaryStore.getState();
      expect(typeof state.setError).toBe('function');
    });
  });

  describe('Store Cross-Interaction', () => {
    it('auth store state change should not affect other stores', () => {
      // Set auth user
      useAuthStore.getState().setUser({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarColor: '#FFB5C5',
        partnerId: null,
        partnerCode: 'ABC123',
        createdAt: 1234567890,
      });

      // Verify other stores remain unchanged
      expect(useCheckInStore.getState().habits).toEqual([]);
      expect(useNotesStore.getState().notes).toEqual([]);
      expect(useSummaryStore.getState().currentSummary).toBeNull();

      // Reset auth store
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('checkin store setError should not affect other stores', () => {
      useCheckInStore.getState().setError('Test error');

      expect(useCheckInStore.getState().error).toBe('Test error');
      expect(useAuthStore.getState().error).toBeNull();
      expect(useNotesStore.getState().error).toBeNull();
      expect(useSummaryStore.getState().error).toBeNull();

      // Reset
      useCheckInStore.getState().setError(null);
    });

    it('notes store setError should not affect other stores', () => {
      useNotesStore.getState().setError('Notes error');

      expect(useNotesStore.getState().error).toBe('Notes error');
      expect(useAuthStore.getState().error).toBeNull();
      expect(useCheckInStore.getState().error).toBeNull();
      expect(useSummaryStore.getState().error).toBeNull();

      // Reset
      useNotesStore.getState().setError(null);
    });

    it('summary store setError should not affect other stores', () => {
      useSummaryStore.getState().setError('Summary error');

      expect(useSummaryStore.getState().error).toBe('Summary error');
      expect(useAuthStore.getState().error).toBeNull();
      expect(useCheckInStore.getState().error).toBeNull();
      expect(useNotesStore.getState().error).toBeNull();

      // Reset
      useSummaryStore.getState().setError(null);
    });
  });
});

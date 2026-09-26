/**
 * checkin.service 单元测试
 * 所有 Firebase 相关调用均使用 mock
 */

// Mock Firebase 模块
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue({ name: 'test-app' }),
  getApps: jest.fn().mockReturnValue([]),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn().mockReturnValue({
    currentUser: { uid: 'test-uid' },
  }),
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
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn().mockReturnValue({ seconds: 1234567890 }),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn().mockReturnValue({}),
}));

// Mock id 生成器
jest.mock('@/utils/id', () => ({
  generateId: jest.fn().mockReturnValue('habit-id-123'),
  generatePartnerCode: jest.fn().mockReturnValue('ABC123'),
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

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { generateId } from '@/utils/id';
import { calculateStreak, getTodayString } from '@/utils/date';
import {
  createHabit,
  getHabits,
  subscribeToHabits,
  updateHabit,
  archiveHabit,
  toggleCheckIn,
  getCheckInsForDate,
  subscribeToCheckInsForDate,
  getCheckInDates,
  getCheckInStreak,
  getMonthCheckInMap,
} from '@/services/checkin.service';
import type { Habit, CheckInRecord, CheckInCategory } from '@/types';

const mockHabit: Habit = {
  id: 'habit-id-123',
  userId: 'test-uid',
  title: '早起',
  category: 'health' as CheckInCategory,
  icon: 'weather-sunny',
  color: '#FFB5C5',
  targetDays: 30,
  reminderTime: '07:00',
  createdAt: 1234567890,
  archived: false,
};

const mockCheckInRecord: CheckInRecord = {
  id: 'habit-id-123_2026-09-13',
  habitId: 'habit-id-123',
  userId: 'test-uid',
  date: '2026-09-13',
  completed: true,
  note: '今天起得很早',
  mood: 'great',
  createdAt: 1234567890,
};

describe('CheckIn Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (generateId as jest.Mock).mockReturnValue('habit-id-123');
    (getTodayString as jest.Mock).mockReturnValue('2026-09-13');
  });

  describe('createHabit', () => {
    it('should create a habit with correct fields', async () => {
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await createHabit(
        '早起',
        'health',
        'weather-sunny',
        '#FFB5C5',
        30,
        '07:00',
      );

      expect(setDoc).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('habit-id-123');
      expect(result.userId).toBe('test-uid');
      expect(result.title).toBe('早起');
      expect(result.category).toBe('health');
      expect(result.icon).toBe('weather-sunny');
      expect(result.color).toBe('#FFB5C5');
      expect(result.targetDays).toBe(30);
      expect(result.reminderTime).toBe('07:00');
      expect(result.archived).toBe(false);
      expect(typeof result.createdAt).toBe('number');
    });

    it('should use serverTimestamp for Firestore createdAt', async () => {
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await createHabit('早起', 'health', 'weather-sunny', '#FFB5C5', 30, '07:00');

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          createdAt: serverTimestamp(),
        }),
      );
    });

    it('should handle null reminderTime', async () => {
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await createHabit(
        '喝水',
        'health',
        'water',
        '#A8E6CF',
        7,
        null,
      );

      expect(result.reminderTime).toBeNull();
    });
  });

  describe('getHabits', () => {
    it('should return list of habits', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          { data: () => mockHabit },
          { data: () => ({ ...mockHabit, id: 'habit-2', title: '运动' }) },
        ],
      });

      const result = await getHabits();

      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('archived', '==', false);
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'asc');
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('早起');
      expect(result[1].title).toBe('运动');
    });

    it('should return empty array when no habits', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
      });

      const result = await getHabits();

      expect(result).toEqual([]);
    });
  });

  describe('subscribeToHabits', () => {
    it('should return unsubscribe function', () => {
      const mockUnsubscribe = jest.fn();
      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = subscribeToHabits(jest.fn());

      expect(onSnapshot).toHaveBeenCalledTimes(1);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should call callback with habits when snapshot changes', () => {
      let snapshotCallback: any = null;
      (onSnapshot as jest.Mock).mockImplementation((_q, callback) => {
        snapshotCallback = callback;
        return jest.fn();
      });

      const callback = jest.fn();
      subscribeToHabits(callback);

      // 触发 snapshot
      snapshotCallback({
        docs: [{ data: () => mockHabit }],
      });

      expect(callback).toHaveBeenCalledWith([mockHabit]);
    });
  });

  describe('updateHabit', () => {
    it('should update habit with provided updates', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateHabit('habit-id-123', { title: '新标题', targetDays: 60 });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { title: '新标题', targetDays: 60 },
      );
    });
  });

  describe('archiveHabit', () => {
    it('should set archived to true', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await archiveHabit('habit-id-123');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { archived: true },
      );
    });
  });

  describe('toggleCheckIn', () => {
    it('should create new check-in when none exists', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await toggleCheckIn(
        'habit-id-123',
        '2026-09-13',
        '今天起得很早',
        'great',
      );

      expect(getDoc).toHaveBeenCalledTimes(1);
      expect(setDoc).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('habit-id-123_2026-09-13');
      expect(result.habitId).toBe('habit-id-123');
      expect(result.date).toBe('2026-09-13');
      expect(result.completed).toBe(true);
      expect(result.note).toBe('今天起得很早');
      expect(result.mood).toBe('great');
    });

    it('should toggle completed when check-in already exists (true -> false)', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockCheckInRecord,
      });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await toggleCheckIn(
        'habit-id-123',
        '2026-09-13',
        null,
        null,
      );

      expect(getDoc).toHaveBeenCalledTimes(1);
      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(result.completed).toBe(false);
    });

    it('should toggle completed when check-in already exists (false -> true)', async () => {
      const uncheckedRecord = { ...mockCheckInRecord, completed: false };
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => uncheckedRecord,
      });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await toggleCheckIn(
        'habit-id-123',
        '2026-09-13',
        '坚持!',
        'good',
      );

      expect(result.completed).toBe(true);
      expect(result.note).toBe('坚持!');
      expect(result.mood).toBe('good');
    });

    it('should generate correct checkIn ID format', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await toggleCheckIn(
        'my-habit',
        '2026-01-15',
        null,
        null,
      );

      expect(result.id).toBe('my-habit_2026-01-15');
    });
  });

  describe('getCheckInsForDate', () => {
    it('should return check-ins for specific date', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          { data: () => mockCheckInRecord },
          { data: () => ({ ...mockCheckInRecord, habitId: 'habit-2', id: 'habit-2_2026-09-13' }) },
        ],
      });

      const result = await getCheckInsForDate('2026-09-13');

      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('date', '==', '2026-09-13');
      expect(where).toHaveBeenCalledWith('completed', '==', true);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no check-ins', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
      });

      const result = await getCheckInsForDate('2026-09-13');

      expect(result).toEqual([]);
    });
  });

  describe('subscribeToCheckInsForDate', () => {
    it('should return unsubscribe function', () => {
      const mockUnsubscribe = jest.fn();
      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = subscribeToCheckInsForDate('2026-09-13', jest.fn());

      expect(onSnapshot).toHaveBeenCalledTimes(1);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should call callback with records when snapshot changes', () => {
      let snapshotCallback: any = null;
      (onSnapshot as jest.Mock).mockImplementation((_q, callback) => {
        snapshotCallback = callback;
        return jest.fn();
      });

      const callback = jest.fn();
      subscribeToCheckInsForDate('2026-09-13', callback);

      snapshotCallback({
        docs: [{ data: () => mockCheckInRecord }],
      });

      expect(callback).toHaveBeenCalledWith([mockCheckInRecord]);
    });
  });

  describe('getCheckInDates', () => {
    it('should return sorted dates for a habit', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          { data: () => ({ date: '2026-09-13' }) },
          { data: () => ({ date: '2026-09-11' }) },
          { data: () => ({ date: '2026-09-12' }) },
        ],
      });

      const result = await getCheckInDates('habit-id-123');

      expect(result).toEqual(['2026-09-11', '2026-09-12', '2026-09-13']);
    });

    it('should return empty array when no check-ins', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
      });

      const result = await getCheckInDates('habit-id-123');

      expect(result).toEqual([]);
    });
  });

  describe('getCheckInStreak', () => {
    it('should return streak info for a habit', async () => {
      const mockDates = ['2026-09-11', '2026-09-12', '2026-09-13'];
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockDates.map((d) => ({ data: () => ({ date: d }) })),
      });
      (calculateStreak as jest.Mock).mockReturnValue(3);

      const result = await getCheckInStreak('habit-id-123');

      expect(result.habitId).toBe('habit-id-123');
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
      expect(result.lastCheckInDate).toBe('2026-09-13');
      expect(result.totalCheckIns).toBe(3);
    });

    it('should return zero streak when no check-ins', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
      });
      (calculateStreak as jest.Mock).mockReturnValue(0);

      const result = await getCheckInStreak('habit-id-123');

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.lastCheckInDate).toBeNull();
      expect(result.totalCheckIns).toBe(0);
    });

    it('should calculate longest streak correctly for non-consecutive dates', async () => {
      const mockDates = ['2026-09-01', '2026-09-02', '2026-09-05', '2026-09-06', '2026-09-07'];
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockDates.map((d) => ({ data: () => ({ date: d }) })),
      });
      (calculateStreak as jest.Mock).mockReturnValue(0);

      const result = await getCheckInStreak('habit-id-123');

      // Longest streak should be 3 (09-05, 09-06, 09-07)
      expect(result.longestStreak).toBe(3);
    });
  });

  describe('getMonthCheckInMap', () => {
    it('should return map of checked dates for a month', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          { data: () => ({ date: '2026-09-01', completed: true }) },
          { data: () => ({ date: '2026-09-05', completed: true }) },
          { data: () => ({ date: '2026-09-13', completed: true }) },
        ],
      });

      const result = await getMonthCheckInMap('habit-id-123', 2026, 9);

      expect(typeof result).toBe('object');
      expect(result['2026-09-01']).toBe(true);
      expect(result['2026-09-05']).toBe(true);
      expect(result['2026-09-13']).toBe(true);
      expect(result['2026-09-02']).toBeUndefined();
    });

    it('should return empty map when no check-ins in month', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
      });

      const result = await getMonthCheckInMap('habit-id-123', 2026, 9);

      expect(result).toEqual({});
    });
  });
});

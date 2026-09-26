/**
 * ai.service 单元测试
 * 所有 Firebase 相关调用均使用 mock
 */

// Mock Firebase service
jest.mock('@/services/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-uid', displayName: '测试用户' },
  },
  functions: {},
  default: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn().mockReturnValue({ id: 'test-doc' }),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(),
}));

// Mock date utils
jest.mock('@/utils/date', () => ({
  getTodayString: jest.fn().mockReturnValue('2026-09-13'),
  getWeekRange: jest.fn().mockReturnValue(['2026-09-07', '2026-09-13']),
  getMonthRange: jest.fn().mockReturnValue(['2026-09-01', '2026-09-30']),
  formatDate: jest.fn(),
}));

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getTodayString, getWeekRange, getMonthRange } from '@/utils/date';
import {
  generateSummary,
  getSummary,
  getRecentSummaries,
} from '@/services/ai.service';
import type { Habit, CheckInRecord, Note, SummaryResult } from '@/types';

const mockHabits: Habit[] = [
  {
    id: 'habit-1',
    userId: 'test-uid',
    title: '早起',
    category: 'health',
    icon: 'weather-sunny',
    color: '#FFB5C5',
    targetDays: 30,
    reminderTime: '07:00',
    createdAt: 1234567890,
    archived: false,
  },
  {
    id: 'habit-2',
    userId: 'test-uid',
    title: '阅读',
    category: 'study',
    icon: 'book-open-variant',
    color: '#A8E6CF',
    targetDays: 21,
    reminderTime: null,
    createdAt: 1234567890,
    archived: false,
  },
];

const mockCheckIns: CheckInRecord[] = [
  {
    id: 'habit-1_2026-09-13',
    habitId: 'habit-1',
    userId: 'test-uid',
    date: '2026-09-13',
    completed: true,
    note: '今天起得很早',
    mood: 'great',
    createdAt: 1234567890,
  },
  {
    id: 'habit-2_2026-09-13',
    habitId: 'habit-2',
    userId: 'test-uid',
    date: '2026-09-13',
    completed: true,
    note: '读了30页书',
    mood: 'good',
    createdAt: 1234567890,
  },
];

const mockNotes: Note[] = [
  {
    id: 'note-1',
    userId: 'test-uid',
    title: '今日感想',
    content: '今天过得很充实，早起读书感觉很好~',
    colorIndex: 0,
    tag: 'diary',
    pinned: false,
    checklistItems: null,
    createdAt: 1234567890,
    updatedAt: 1234567890,
  },
];

const mockAIResponse = {
  data: {
    content: '## 今日总结\n\n你今天真棒！✨',
    highlights: ['早起打卡成功', '阅读习惯保持', '便签记录充实'],
    mood: '积极',
    suggestions: ['继续保持早睡早起', '可以尝试增加运动习惯'],
  },
};

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getTodayString as jest.Mock).mockReturnValue('2026-09-13');
    (getWeekRange as jest.Mock).mockReturnValue(['2026-09-07', '2026-09-13']);
    (getMonthRange as jest.Mock).mockReturnValue(['2026-09-01', '2026-09-30']);
  });

  describe('generateSummary', () => {
    beforeEach(() => {
      // Mock habits query
      (getDocs as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          docs: [
            { data: () => mockHabits[0] },
            { data: () => mockHabits[1] },
          ],
        });
      });

      // Mock user doc
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ displayName: '测试用户' }),
      });

      // Mock httpsCallable
      const mockCallable = jest.fn().mockResolvedValue(mockAIResponse);
      (httpsCallable as jest.Mock).mockReturnValue(mockCallable);

      // Mock setDoc
      (setDoc as jest.Mock).mockResolvedValue(undefined);
    });

    it('should generate daily summary correctly', async () => {
      const result = await generateSummary('daily');

      expect(httpsCallable).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledTimes(1);
      expect(result.period).toBe('daily');
      expect(result.startDate).toBe('2026-09-13');
      expect(result.endDate).toBe('2026-09-13');
      expect(result.userId).toBe('test-uid');
      expect(result.content).toBe(mockAIResponse.data.content);
      expect(result.highlights).toEqual(mockAIResponse.data.highlights);
      expect(result.mood).toBe('积极');
      expect(result.partnerSummary).toBeNull();
      expect(typeof result.createdAt).toBe('number');
    });

    it('should generate weekly summary with correct date range', async () => {
      const result = await generateSummary('weekly');

      expect(getWeekRange).toHaveBeenCalledWith('2026-09-13');
      expect(result.period).toBe('weekly');
      expect(result.startDate).toBe('2026-09-07');
      expect(result.endDate).toBe('2026-09-13');
    });

    it('should generate monthly summary with correct date range', async () => {
      const result = await generateSummary('monthly');

      expect(getMonthRange).toHaveBeenCalledWith('2026-09-13');
      expect(result.period).toBe('monthly');
      expect(result.startDate).toBe('2026-09-01');
      expect(result.endDate).toBe('2026-09-30');
    });

    it('should generate correct summary ID format', async () => {
      const result = await generateSummary('daily');

      expect(result.id).toBe('summary_test-uid_daily_2026-09-13');
    });

    it('should save summary to Firestore summaries collection', async () => {
      await generateSummary('daily');

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: 'summary_test-uid_daily_2026-09-13',
          userId: 'test-uid',
          period: 'daily',
        }),
      );
    });

    it('should call Cloud Function with correct parameters', async () => {
      const mockCallable = jest.fn().mockResolvedValue(mockAIResponse);
      (httpsCallable as jest.Mock).mockReturnValue(mockCallable);

      await generateSummary('daily');

      expect(mockCallable).toHaveBeenCalledWith(
        expect.objectContaining({
          period: 'daily',
          startDate: '2026-09-13',
          endDate: '2026-09-13',
          userName: '测试用户',
        }),
      );
    });

    it('should use default mood when AI response does not include mood', async () => {
      const responseWithoutMood = {
        data: {
          content: '总结内容',
          highlights: ['亮点1'],
          suggestions: ['建议1'],
        },
      };
      const mockCallable = jest.fn().mockResolvedValue(responseWithoutMood);
      (httpsCallable as jest.Mock).mockReturnValue(mockCallable);

      const result = await generateSummary('daily');

      expect(result.mood).toBe('积极');
    });

    it('should use default highlights when AI response does not include highlights', async () => {
      const responseWithoutHighlights = {
        data: {
          content: '总结内容',
          mood: '开心',
          suggestions: ['建议1'],
        },
      };
      const mockCallable = jest.fn().mockResolvedValue(responseWithoutHighlights);
      (httpsCallable as jest.Mock).mockReturnValue(mockCallable);

      const result = await generateSummary('daily');

      expect(result.highlights).toEqual([]);
    });

    it('should use default suggestions when AI response does not include suggestions', async () => {
      const responseWithoutSuggestions = {
        data: {
          content: '总结内容',
          highlights: ['亮点1'],
          mood: '开心',
        },
      };
      const mockCallable = jest.fn().mockResolvedValue(responseWithoutSuggestions);
      (httpsCallable as jest.Mock).mockReturnValue(mockCallable);

      const result = await generateSummary('daily');

      expect(result.suggestions).toEqual([]);
    });
  });

  describe('getSummary', () => {
    it('should return summary when it exists', async () => {
      const mockSummary: SummaryResult = {
        id: 'summary_test-uid_daily_2026-09-13',
        userId: 'test-uid',
        period: 'daily',
        startDate: '2026-09-13',
        endDate: '2026-09-13',
        content: '## 总结',
        highlights: ['亮点1'],
        mood: '积极',
        suggestions: ['建议1'],
        partnerSummary: null,
        createdAt: 1234567890,
      };

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockSummary,
      });

      const result = await getSummary('daily', '2026-09-13');

      expect(result).toEqual(mockSummary);
      expect(doc).toHaveBeenCalledWith(
        expect.anything(),
        'summaries',
        'summary_test-uid_daily_2026-09-13',
      );
    });

    it('should return null when summary does not exist', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const result = await getSummary('weekly', '2026-09-07');

      expect(result).toBeNull();
    });
  });

  describe('getRecentSummaries', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return recent summaries ordered by createdAt desc', async () => {
      const mockSummaries: SummaryResult[] = [
        {
          id: 'summary_test-uid_daily_2026-09-13',
          userId: 'test-uid',
          period: 'daily',
          startDate: '2026-09-13',
          endDate: '2026-09-13',
          content: '今日总结',
          highlights: ['亮点1'],
          mood: '积极',
          suggestions: ['建议1'],
          partnerSummary: null,
          createdAt: 1234567890,
        },
        {
          id: 'summary_test-uid_daily_2026-09-12',
          userId: 'test-uid',
          period: 'daily',
          startDate: '2026-09-12',
          endDate: '2026-09-12',
          content: '昨日总结',
          highlights: ['亮点2'],
          mood: '平静',
          suggestions: ['建议2'],
          partnerSummary: null,
          createdAt: 1234481490,
        },
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSummaries.map((s) => ({ data: () => s })),
      });

      const result = await getRecentSummaries(10);

      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('userId', '==', 'test-uid');
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('summary_test-uid_daily_2026-09-13');
    });

    it('should respect the limit parameter', async () => {
      const manySummaries = Array.from({ length: 15 }, (_, i) => ({
        id: `summary-${i}`,
        userId: 'test-uid',
        period: 'daily' as const,
        startDate: `2026-09-${String(i + 1).padStart(2, '0')}`,
        endDate: `2026-09-${String(i + 1).padStart(2, '0')}`,
        content: `总结${i}`,
        highlights: [`亮点${i}`],
        mood: '积极',
        suggestions: [`建议${i}`],
        partnerSummary: null,
        createdAt: 1234567890 + i * 86400000,
      }));

      (getDocs as jest.Mock).mockResolvedValue({
        docs: manySummaries.map((s) => ({ data: () => s })),
      });

      const result = await getRecentSummaries(5);

      expect(result).toHaveLength(5);
    });

    it('should return empty array when no summaries exist', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
      });

      const result = await getRecentSummaries();

      expect(result).toEqual([]);
    });
  });
});

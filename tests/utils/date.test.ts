import {
  formatDate,
  getTodayString,
  getStreakDates,
  calculateStreak,
  getWeekRange,
  getMonthRange,
  isSameDay,
  addDays,
  getRelativeLabel,
} from '@/utils/date';

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date to YYYY-MM-DD', () => {
      expect(formatDate(new Date(2026, 8, 13))).toBe('2026-09-13');
    });

    it('should pad single digit month and day', () => {
      expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
  });

  describe('getTodayString', () => {
    it('should get today string in YYYY-MM-DD format', () => {
      const today = getTodayString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return correct today date', () => {
      const today = getTodayString();
      const expected = formatDate(new Date());
      expect(today).toBe(expected);
    });
  });

  describe('calculateStreak', () => {
    it('should calculate streak from consecutive dates', () => {
      const dates = ['2026-09-11', '2026-09-12', '2026-09-13'];
      expect(calculateStreak(dates, '2026-09-13')).toBe(3);
    });

    it('should return 0 streak for broken chain', () => {
      const dates = ['2026-09-10', '2026-09-11'];
      expect(calculateStreak(dates, '2026-09-13')).toBe(0);
    });

    it('should return 0 for empty dates array', () => {
      expect(calculateStreak([], '2026-09-13')).toBe(0);
    });

    it('should return 1 for only today', () => {
      const dates = ['2026-09-13'];
      expect(calculateStreak(dates, '2026-09-13')).toBe(1);
    });

    it('should handle unsorted dates', () => {
      const dates = ['2026-09-13', '2026-09-11', '2026-09-12'];
      expect(calculateStreak(dates, '2026-09-13')).toBe(3);
    });

    it('should handle duplicate dates', () => {
      const dates = ['2026-09-12', '2026-09-12', '2026-09-13'];
      expect(calculateStreak(dates, '2026-09-13')).toBe(2);
    });

    it('should handle streak across month boundary', () => {
      const dates = ['2026-08-30', '2026-08-31', '2026-09-01'];
      expect(calculateStreak(dates, '2026-09-01')).toBe(3);
    });
  });

  describe('getStreakDates', () => {
    it('should return empty array for 0 days', () => {
      expect(getStreakDates(0, '2026-09-13')).toEqual([]);
    });

    it('should return single date for 1 day', () => {
      expect(getStreakDates(1, '2026-09-13')).toEqual(['2026-09-13']);
    });

    it('should return consecutive dates in order', () => {
      expect(getStreakDates(3, '2026-09-13')).toEqual([
        '2026-09-11',
        '2026-09-12',
        '2026-09-13',
      ]);
    });

    it('should handle streak across month boundary', () => {
      expect(getStreakDates(3, '2026-09-02')).toEqual([
        '2026-08-31',
        '2026-09-01',
        '2026-09-02',
      ]);
    });
  });

  describe('getWeekRange', () => {
    it('should get week range (Monday to Sunday)', () => {
      const [start, end] = getWeekRange('2026-09-13');
      expect(start).toBe('2026-09-07');
      expect(end).toBe('2026-09-13');
    });

    it('should handle first day of week', () => {
      const [start, end] = getWeekRange('2026-09-07');
      expect(start).toBe('2026-09-07');
      expect(end).toBe('2026-09-13');
    });

    it('should handle week across month boundary', () => {
      const [start, end] = getWeekRange('2026-09-01');
      expect(start).toBe('2026-08-31');
      expect(end).toBe('2026-09-06');
    });
  });

  describe('getMonthRange', () => {
    it('should get month range', () => {
      const [start, end] = getMonthRange('2026-09-13');
      expect(start).toBe('2026-09-01');
      expect(end).toBe('2026-09-30');
    });

    it('should handle February in non-leap year', () => {
      const [start, end] = getMonthRange('2026-02-15');
      expect(start).toBe('2026-02-01');
      expect(end).toBe('2026-02-28');
    });

    it('should handle February in leap year', () => {
      const [start, end] = getMonthRange('2024-02-15');
      expect(start).toBe('2024-02-01');
      expect(end).toBe('2024-02-29');
    });
  });

  describe('isSameDay', () => {
    it('should detect same day', () => {
      expect(isSameDay('2026-09-13', '2026-09-13')).toBe(true);
    });

    it('should detect different days', () => {
      expect(isSameDay('2026-09-13', '2026-09-14')).toBe(false);
    });

    it('should handle different months', () => {
      expect(isSameDay('2026-08-31', '2026-09-01')).toBe(false);
    });
  });

  describe('addDays', () => {
    it('should add positive days to date string', () => {
      expect(addDays('2026-09-13', 1)).toBe('2026-09-14');
    });

    it('should add negative days to date string', () => {
      expect(addDays('2026-09-13', -1)).toBe('2026-09-12');
    });

    it('should handle month boundary', () => {
      expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
      expect(addDays('2026-09-01', -1)).toBe('2026-08-31');
    });

    it('should handle adding 0 days', () => {
      expect(addDays('2026-09-13', 0)).toBe('2026-09-13');
    });
  });

  describe('getRelativeLabel', () => {
    it('should return 今天 for today', () => {
      const today = formatDate(new Date());
      expect(getRelativeLabel(today)).toBe('今天');
    });

    it('should return 昨天 for yesterday', () => {
      const yesterday = addDays(formatDate(new Date()), -1);
      expect(getRelativeLabel(yesterday)).toBe('昨天');
    });

    it('should return 前天 for day before yesterday', () => {
      const dayBefore = addDays(formatDate(new Date()), -2);
      expect(getRelativeLabel(dayBefore)).toBe('前天');
    });

    it('should return N天前 for dates within a week', () => {
      const fiveDaysAgo = addDays(formatDate(new Date()), -5);
      expect(getRelativeLabel(fiveDaysAgo)).toBe('5天前');
    });

    it('should return M月d日 for dates older than a week', () => {
      const oldDate = addDays(formatDate(new Date()), -10);
      const label = getRelativeLabel(oldDate);
      expect(label).toMatch(/^\d+月\d+日$/);
    });
  });
});

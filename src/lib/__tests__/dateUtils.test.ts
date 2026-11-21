import { describe, it, expect } from 'vitest';
import { 
  getTodayDateString, 
  formatDateString, 
  parseDateString, 
  getDisplayDate, 
  isHabitDueOnDate, 
  getDaysInRange 
} from '../dateUtils';

describe('dateUtils', () => {
  it('formats Date object to YYYY-MM-DD string', () => {
    const testDate = new Date(2026, 9, 29); // Oct 29, 2026
    expect(formatDateString(testDate)).toBe('2026-10-29');
  });

  it('parses YYYY-MM-DD string to valid local Date', () => {
    const parsed = parseDateString('2026-10-29');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9); // 0-indexed October
    expect(parsed.getDate()).toBe(29);
  });

  it('handles getTodayDateString with offsets correctly', () => {
    const today = getTodayDateString(0);
    const yesterday = getTodayDateString(-1);
    const tomorrow = getTodayDateString(1);

    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(tomorrow).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(today).not.toBe(yesterday);
  });

  it('returns readable display date', () => {
    const formatted = getDisplayDate('2026-10-29');
    expect(formatted).toContain('Oct');
    expect(formatted).toContain('29');
  });

  describe('isHabitDueOnDate', () => {
    // 2026-10-25 is Sunday (day 0)
    // 2026-10-26 is Monday (day 1)
    // 2026-10-31 is Saturday (day 6)
    const sundayStr = '2026-10-25';
    const mondayStr = '2026-10-26';
    const saturdayStr = '2026-10-31';

    it('returns true for daily habits on any day', () => {
      expect(isHabitDueOnDate('daily', undefined, mondayStr)).toBe(true);
      expect(isHabitDueOnDate('daily', undefined, sundayStr)).toBe(true);
    });

    it('checks weekdays properly (Mon-Fri only)', () => {
      expect(isHabitDueOnDate('weekdays', undefined, mondayStr)).toBe(true);
      expect(isHabitDueOnDate('weekdays', undefined, sundayStr)).toBe(false);
      expect(isHabitDueOnDate('weekdays', undefined, saturdayStr)).toBe(false);
    });

    it('checks weekends properly (Sat-Sun only)', () => {
      expect(isHabitDueOnDate('weekends', undefined, mondayStr)).toBe(false);
      expect(isHabitDueOnDate('weekends', undefined, sundayStr)).toBe(true);
      expect(isHabitDueOnDate('weekends', undefined, saturdayStr)).toBe(true);
    });

    it('supports custom days array', () => {
      // Habit due only on Mondays (1) and Wednesdays (3)
      const customDays = [1, 3];
      expect(isHabitDueOnDate('custom', customDays, mondayStr)).toBe(true);
      expect(isHabitDueOnDate('custom', customDays, sundayStr)).toBe(false);
    });
  });

  it('generates continuous list of days in range', () => {
    const range = getDaysInRange('2026-10-28', '2026-10-30');
    expect(range).toEqual(['2026-10-28', '2026-10-29', '2026-10-30']);
  });
});

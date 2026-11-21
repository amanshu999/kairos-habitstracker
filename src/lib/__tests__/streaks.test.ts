import { describe, it, expect } from 'vitest';
import { calculateHabitStreak } from '../streaks';
import { Habit, HabitLog } from '../../types';

describe('calculateHabitStreak', () => {
  const baseHabit: Habit = {
    id: 'habit-1',
    title: 'Code Commit',
    category: 'engineering',
    type: 'boolean',
    target_value: 1,
    frequency: 'daily',
    created_at: '2026-10-01T00:00:00.000Z',
    archived: false,
    order_index: 0,
    streak_freeze_used_dates: [],
  };

  it('returns 0 streak when habit has zero completed logs', () => {
    const result = calculateHabitStreak(baseHabit, [], '2026-10-29');
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.isCompletedToday).toBe(false);
    expect(result.totalCompletions).toBe(0);
  });

  it('counts streak = 1 when completed today', () => {
    const today = '2026-10-29';
    const logs: HabitLog[] = [
      {
        id: 'log-1',
        habit_id: 'habit-1',
        date: today,
        completed: true,
        value: 1,
        updated_at: '2026-10-29T10:00:00.000Z',
      },
    ];

    const result = calculateHabitStreak(baseHabit, logs, today);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.isCompletedToday).toBe(true);
    expect(result.totalCompletions).toBe(1);
  });

  it('maintains streak when yesterday was completed but today is pending', () => {
    const today = '2026-10-29';
    const yesterday = '2026-10-28';
    const dayBefore = '2026-10-27';

    const logs: HabitLog[] = [
      {
        id: 'log-1',
        habit_id: 'habit-1',
        date: yesterday,
        completed: true,
        value: 1,
        updated_at: `${yesterday}T10:00:00.000Z`,
      },
      {
        id: 'log-2',
        habit_id: 'habit-1',
        date: dayBefore,
        completed: true,
        value: 1,
        updated_at: `${dayBefore}T10:00:00.000Z`,
      },
    ];

    const result = calculateHabitStreak(baseHabit, logs, today);
    // Even though today is not completed yet, active streak is preserved at 2
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
    expect(result.isCompletedToday).toBe(false);
  });

  it('resets current streak when a previous due day was missed', () => {
    const today = '2026-10-29';
    const dayBeforeYesterday = '2026-10-27'; // 2026-10-28 was missed!

    const logs: HabitLog[] = [
      {
        id: 'log-1',
        habit_id: 'habit-1',
        date: dayBeforeYesterday,
        completed: true,
        value: 1,
        updated_at: `${dayBeforeYesterday}T10:00:00.000Z`,
      },
    ];

    const result = calculateHabitStreak(baseHabit, logs, today);
    // 2026-10-28 was missed without a freeze, so streak is broken
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(1);
  });

  it('preserves streak when a missed day is covered by a streak freeze token', () => {
    const today = '2026-10-29';
    const yesterday = '2026-10-28'; // missed but frozen!
    const dayBefore = '2026-10-27';

    const habitWithFreeze: Habit = {
      ...baseHabit,
      streak_freeze_used_dates: [yesterday],
    };

    const logs: HabitLog[] = [
      {
        id: 'log-1',
        habit_id: 'habit-1',
        date: dayBefore,
        completed: true,
        value: 1,
        updated_at: `${dayBefore}T10:00:00.000Z`,
      },
    ];

    const result = calculateHabitStreak(habitWithFreeze, logs, today);
    // 2026-10-27 completed + 2026-10-28 frozen = streak of 2 maintained!
    expect(result.currentStreak).toBe(2);
  });

  it('does not penalize weekdays-only habits on weekends', () => {
    // 2026-10-26 is Monday
    // 2026-10-23 is Friday
    // Saturday (24) and Sunday (25) are non-working days
    const weekdayHabit: Habit = {
      ...baseHabit,
      frequency: 'weekdays',
    };

    const friday = '2026-10-23';
    const monday = '2026-10-26';

    const logs: HabitLog[] = [
      {
        id: 'log-1',
        habit_id: 'habit-1',
        date: friday,
        completed: true,
        value: 1,
        updated_at: `${friday}T10:00:00.000Z`,
      },
      {
        id: 'log-2',
        habit_id: 'habit-1',
        date: monday,
        completed: true,
        value: 1,
        updated_at: `${monday}T10:00:00.000Z`,
      },
    ];

    const result = calculateHabitStreak(weekdayHabit, logs, monday);
    // Weekend was skipped because habit is weekdays only, streak is 2!
    expect(result.currentStreak).toBe(2);
  });
});


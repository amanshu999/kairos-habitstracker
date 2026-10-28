import { Habit, HabitLog, StreakInfo } from '../types';
import { getTodayDateString, isHabitDueOnDate, parseDateString, formatDateString } from './dateUtils';

export function calculateHabitStreak(
  habit: Habit,
  logs: HabitLog[],
  todayStr: string = getTodayDateString()
): StreakInfo {
  // Map date -> log
  const logMap = new Map<string, HabitLog>();
  let totalCompletions = 0;

  for (const log of logs) {
    if (log.habit_id === habit.id && log.completed) {
      logMap.set(log.date, log);
      totalCompletions++;
    }
  }

  const isCompletedToday = Boolean(logMap.get(todayStr)?.completed);
  const freezeUsedDays: string[] = habit.streak_freeze_used_dates || [];

  // Calculate Current Streak
  let currentStreak = 0;
  let checkDate = parseDateString(todayStr);

  // Check if today was due
  const todayDue = isHabitDueOnDate(habit.frequency, habit.custom_days, todayStr);

  if (todayDue) {
    if (isCompletedToday) {
      currentStreak++;
      // Move to yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Not completed today yet. The streak is NOT broken yet; we start checking from yesterday.
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } else {
    // If not due today, start checking from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Go backwards day by day to count consecutive completed days
  // Safety cap of 1000 days to prevent infinite loops
  for (let i = 0; i < 1000; i++) {
    const dateStr = formatDateString(checkDate);
    const isDue = isHabitDueOnDate(habit.frequency, habit.custom_days, dateStr);

    if (isDue) {
      if (logMap.has(dateStr)) {
        currentStreak++;
      } else if (freezeUsedDays.includes(dateStr)) {
        // Protected by streak freeze
        currentStreak++;
      } else {
        // Streak is broken
        break;
      }
    }
    // Decrement one day
    checkDate.setDate(checkDate.getDate() - 1);

    // Stop if we go before habit creation date (with 1 day buffer)
    if (habit.created_at) {
      const createdDate = parseDateString(habit.created_at.split('T')[0]);
      createdDate.setDate(createdDate.getDate() - 2);
      if (checkDate < createdDate) {
        break;
      }
    }
  }

  // Calculate Longest Streak
  // Gather all unique dates where log was completed or freeze used
  const completedDateStrings = Array.from(logMap.keys()).sort();
  let longestStreak = 0;
  let runningStreak = 0;

  if (completedDateStrings.length > 0) {
    const firstDate = parseDateString(completedDateStrings[0]);
    const lastDate = parseDateString(todayStr);
    const runner = new Date(firstDate);

    while (runner <= lastDate) {
      const runnerStr = formatDateString(runner);
      const isDue = isHabitDueOnDate(habit.frequency, habit.custom_days, runnerStr);

      if (isDue) {
        if (logMap.has(runnerStr) || freezeUsedDays.includes(runnerStr)) {
          runningStreak++;
          if (runningStreak > longestStreak) {
            longestStreak = runningStreak;
          }
        } else {
          runningStreak = 0;
        }
      }

      runner.setDate(runner.getDate() + 1);
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    isCompletedToday,
    freezeUsedDays,
  };
}

import { Habit, HabitLog, Routine, UserSettings } from '../types';
import { getTodayDateString, parseDateString, formatDateString } from './dateUtils';

export const DEFAULT_SETTINGS: UserSettings = {
  display_name: 'guest@kernel',
  theme: 'terminal-emerald',
  sound_effects: true,
  crt_effects: false,
  week_starts_on: 'monday',
  streak_protection_tokens: 3,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
};

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'h-1',
    title: 'Push Git Commit / Open PR',
    description: 'Keep the GitHub contribution green and ship working code daily',
    category: 'dev',
    type: 'boolean',
    target_value: 1,
    unit: 'commit',
    frequency: 'daily',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    archived: false,
    order_index: 0,
  },
  {
    id: 'h-2',
    title: 'Deep Work: System Architecture & Code',
    description: 'Uninterrupted flow state session with zero notifications',
    category: 'focus',
    type: 'timer',
    target_value: 45,
    unit: 'mins',
    frequency: 'weekdays',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    archived: false,
    order_index: 1,
  },
  {
    id: 'h-3',
    title: 'Hydration Protocol (2.5L Water)',
    description: 'Track daily water intake throughout the work day',
    category: 'health',
    type: 'numeric',
    target_value: 8,
    unit: 'glasses',
    frequency: 'daily',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    archived: false,
    order_index: 2,
  },
  {
    id: 'h-4',
    title: 'Review Tech Docs or Technical Book',
    description: 'Read 20 pages or deep dive into RFCs/specifications',
    category: 'learn',
    type: 'boolean',
    target_value: 1,
    unit: 'session',
    frequency: 'daily',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    archived: false,
    order_index: 3,
  },
  {
    id: 'h-5',
    title: 'Posture & Ergonomic Stretching',
    description: 'Decompress spine, neck, and wrist flexibility routine',
    category: 'health',
    type: 'timer',
    target_value: 10,
    unit: 'mins',
    frequency: 'daily',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    archived: false,
    order_index: 4,
  },
  {
    id: 'h-6',
    title: 'Zero Inbox & Task Triage',
    description: 'Clear backlog, triage pull requests, and organize tomorrow’s sprint',
    category: 'dev',
    type: 'boolean',
    target_value: 1,
    unit: 'done',
    frequency: 'weekdays',
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    archived: false,
    order_index: 5,
  },
];

export const INITIAL_ROUTINES: Routine[] = [
  {
    id: 'r-1',
    name: 'Morning Boot Sequence',
    description: 'Activate body, hydrate, and prepare mind before touching the terminal',
    habit_ids: ['h-3', 'h-5', 'h-4'],
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'r-2',
    name: 'Deep Work Sprint',
    description: 'Flow state execution block and daily commit delivery',
    habit_ids: ['h-2', 'h-1'],
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'r-3',
    name: 'Evening Shutdown Routine',
    description: 'Clear communications, review progress, and log shutdown status',
    habit_ids: ['h-6', 'h-5'],
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

export function generateInitialLogs(): HabitLog[] {
  const logs: HabitLog[] = [];
  const todayStr = getTodayDateString();
  const today = parseDateString(todayStr);

  // Generate 60 days of historical data
  for (let i = 60; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateString(d);
    const dayOfWeek = d.getDay();

    // Git commit habit (high consistency ~85%)
    if (Math.random() > 0.15) {
      logs.push({
        id: `log-h1-${dateStr}`,
        habit_id: 'h-1',
        date: dateStr,
        completed: true,
        value: 1,
        updated_at: new Date(d).toISOString(),
      });
    }

    // Deep Work habit (weekdays ~80%)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (Math.random() > 0.20) {
        logs.push({
          id: `log-h2-${dateStr}`,
          habit_id: 'h-2',
          date: dateStr,
          completed: true,
          value: 45,
          updated_at: new Date(d).toISOString(),
        });
      }
    }

    // Water habit (numeric ~75%)
    const glasses = Math.floor(Math.random() * 5) + 5; // 5 to 9 glasses
    logs.push({
      id: `log-h3-${dateStr}`,
      habit_id: 'h-3',
      date: dateStr,
      completed: glasses >= 8,
      value: glasses,
      updated_at: new Date(d).toISOString(),
    });

    // Tech Docs reading (~70%)
    if (Math.random() > 0.30) {
      logs.push({
        id: `log-h4-${dateStr}`,
        habit_id: 'h-4',
        date: dateStr,
        completed: true,
        value: 1,
        updated_at: new Date(d).toISOString(),
      });
    }

    // Stretching (~65%)
    if (Math.random() > 0.35) {
      logs.push({
        id: `log-h5-${dateStr}`,
        habit_id: 'h-5',
        date: dateStr,
        completed: true,
        value: 10,
        updated_at: new Date(d).toISOString(),
      });
    }

    // Zero inbox (~70% on weekdays)
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && i <= 45) {
      if (Math.random() > 0.30) {
        logs.push({
          id: `log-h6-${dateStr}`,
          habit_id: 'h-6',
          date: dateStr,
          completed: true,
          value: 1,
          updated_at: new Date(d).toISOString(),
        });
      }
    }
  }

  // Ensure yesterday was completed for high-streak habits so today shows an active streak!
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateString(yesterday);

  // Ensure h-1 and h-3 have yesterday completed
  if (!logs.some(l => l.habit_id === 'h-1' && l.date === yesterdayStr)) {
    logs.push({
      id: `log-h1-${yesterdayStr}`,
      habit_id: 'h-1',
      date: yesterdayStr,
      completed: true,
      value: 1,
      updated_at: yesterday.toISOString(),
    });
  }
  if (!logs.some(l => l.habit_id === 'h-3' && l.date === yesterdayStr)) {
    logs.push({
      id: `log-h3-${yesterdayStr}`,
      habit_id: 'h-3',
      date: yesterdayStr,
      completed: true,
      value: 8,
      updated_at: yesterday.toISOString(),
    });
  }

  return logs;
}

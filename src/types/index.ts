export type HabitType = 'boolean' | 'numeric' | 'timer';

export type FrequencyType = 'daily' | 'weekdays' | 'weekends' | 'custom';

export type ThemeType = 'terminal-emerald' | 'matrix-green' | 'dracula' | 'nord' | 'amber-crt';

export interface Habit {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  category: string;
  type: HabitType;
  target_value: number;
  unit?: string;
  frequency: FrequencyType;
  custom_days?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  created_at: string;
  archived: boolean;
  color?: string;
  order_index: number;
  streak_freeze_used_dates?: string[];
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value: number;
  notes?: string;
  updated_at: string;
}

export interface Routine {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  habit_ids: string[];
  created_at: string;
}

export interface UserSettings {
  display_name: string;
  theme: ThemeType;
  sound_effects: boolean;
  crt_effects: boolean;
  week_starts_on: 'monday' | 'sunday';
  streak_protection_tokens: number;
  timezone: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletedDate?: string;
  isCompletedToday: boolean;
  freezeUsedDays: string[];
}

export interface DayAnalytics {
  date: string;
  completedCount: number;
  totalHabitsDue: number;
  percentage: number;
  level: 0 | 1 | 2 | 3 | 4; // for github-style heatmap
}

export type SyncAction = 'upsert' | 'delete';
export type SyncTable = 'habits' | 'habit_logs' | 'routines' | 'profiles';

export interface SyncQueueItem {
  id: string;
  table: SyncTable;
  action: SyncAction;
  data: any;
  timestamp: number;
}

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

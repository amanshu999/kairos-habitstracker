import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  ShieldCheck, 
  Filter, 
  Calendar, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { Habit, HabitLog, StreakInfo, UserSettings } from '../types';
import { HabitCard } from './HabitCard';
import { TerminalPrompt } from './TerminalPrompt';
import { isHabitDueOnDate } from '../lib/dateUtils';

interface DashboardProps {
  habits: Habit[];
  logs: HabitLog[];
  todayStr: string;
  settings: UserSettings;
  streakMap: Map<string, StreakInfo>;
  onToggleComplete: (habitId: string, currentStatus: boolean, value?: number) => void;
  onUpdateValue: (habitId: string, newValue: number) => void;
  onOpenNewHabit: (prefillTitle?: string) => void;
  onEditHabit: (habit: Habit) => void;
  onArchiveHabit: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onSetTheme: (theme: any) => void;
  onOpenRoutineTab: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  habits,
  logs,
  todayStr,
  settings,
  streakMap,
  onToggleComplete,
  onUpdateValue,
  onOpenNewHabit,
  onEditHabit,
  onArchiveHabit,
  onDeleteHabit,
  onSetTheme,
  onOpenRoutineTab,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Today's logs lookup
  const todayLogsMap = useMemo(() => {
    const map = new Map<string, HabitLog>();
    for (const log of logs) {
      if (log.date === todayStr) {
        map.set(log.habit_id, log);
      }
    }
    return map;
  }, [logs, todayStr]);

  // Active unarchived habits due today
  const activeHabitsDueToday = useMemo(() => {
    return habits.filter(h => !h.archived && isHabitDueOnDate(h.frequency, h.custom_days, todayStr));
  }, [habits, todayStr]);

  // Calculate today stats
  const totalDueCount = activeHabitsDueToday.length;
  const completedTodayCount = activeHabitsDueToday.filter(h => {
    const log = todayLogsMap.get(h.id);
    return Boolean(log?.completed);
  }).length;
  const dailyPercentage = totalDueCount > 0 ? Math.round((completedTodayCount / totalDueCount) * 100) : 0;

  // Max streak
  let longestOverallStreak = 0;
  let totalCompletionsEver = 0;
  for (const s of streakMap.values()) {
    if (s.currentStreak > longestOverallStreak) longestOverallStreak = s.currentStreak;
    totalCompletionsEver += s.totalCompletions;
  }

  // Filtered habits
  const displayedHabits = useMemo(() => {
    return activeHabitsDueToday.filter(habit => {
      // Category filter
      if (selectedCategory !== 'all' && habit.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Status filter
      const isDone = Boolean(todayLogsMap.get(habit.id)?.completed);
      if (statusFilter === 'pending' && isDone) return false;
      if (statusFilter === 'completed' && !isDone) return false;
      return true;
    });
  }, [activeHabitsDueToday, selectedCategory, statusFilter, todayLogsMap]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    activeHabitsDueToday.forEach(h => cats.add(h.category.toLowerCase()));
    return ['all', ...Array.from(cats)];
  }, [activeHabitsDueToday]);

  // Greeting
  const currentHour = new Date().getHours();
  let timeGreeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) timeGreeting = 'Good afternoon';
  else if (currentHour >= 17) timeGreeting = 'Good evening';

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Interactive CLI Prompt Header */}
      <TerminalPrompt
        completedCount={completedTodayCount}
        totalHabitsDue={totalDueCount}
        percentage={dailyPercentage}
        longestStreak={longestOverallStreak}
        displayName={settings.display_name}
        onExecuteCommand={(cmd) => {
          if (cmd === 'new' || cmd === 'add') {
            onOpenNewHabit();
            return 'Opened habit creation modal.';
          }
          if (cmd === 'routines') {
            onOpenRoutineTab();
            return 'Navigating to Routines.';
          }
          return undefined;
        }}
        onSetTheme={onSetTheme}
        onOpenNewHabit={onOpenNewHabit}
      />

      {/* Date & Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-term-border">
        <div>
          <div className="flex items-center gap-2 text-term-text-muted text-xs font-mono mb-1">
            <Calendar size={13} className="text-term-accent" />
            <span>{formattedDate}</span>
            <span className="text-term-text-dim">//</span>
            <span className="text-term-cyan font-semibold">WEEK {Math.ceil(new Date().getDate() / 7)}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold text-term-text tracking-tight">
            {timeGreeting}, <span className="text-term-accent">{settings.display_name}</span>.
          </h1>
        </div>

        {/* Quick Add Habit Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenNewHabit()}
            className="px-3.5 py-2 rounded bg-term-accent text-black font-mono font-bold text-xs flex items-center gap-2 hover:opacity-95 shadow-sm transition-transform active:scale-95"
            title="Create Habit (Hotkey: N)"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>NEW_HABIT [N]</span>
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        {/* Daily Completion */}
        <div className="terminal-card rounded-md p-3.5 border border-term-border bg-term-surface">
          <div className="flex items-center justify-between text-xs text-term-text-dim mb-1">
            <span>TODAY_COMPLETION</span>
            <CheckCircle2 size={14} className="text-term-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-term-text">{dailyPercentage}%</span>
            <span className="text-xs text-term-text-muted">
              ({completedTodayCount}/{totalDueCount})
            </span>
          </div>
          <div className="w-full bg-term-elevated rounded-full h-1 mt-2.5 overflow-hidden">
            <div 
              className="bg-term-accent h-full transition-all duration-500"
              style={{ width: `${dailyPercentage}%` }}
            />
          </div>
        </div>

        {/* Longest Active Streak */}
        <div className="terminal-card rounded-md p-3.5 border border-term-border bg-term-surface">
          <div className="flex items-center justify-between text-xs text-term-text-dim mb-1">
            <span>MAX_STREAK</span>
            <Flame size={14} className="text-term-amber fill-term-amber/30" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-term-amber">{longestOverallStreak}</span>
            <span className="text-xs text-term-text-muted">days</span>
          </div>
          <div className="text-[11px] text-term-text-dim mt-2 truncate">
            Consistent execution
          </div>
        </div>

        {/* Total Historical Completions */}
        <div className="terminal-card rounded-md p-3.5 border border-term-border bg-term-surface">
          <div className="flex items-center justify-between text-xs text-term-text-dim mb-1">
            <span>ALL_TIME_LOGS</span>
            <Sparkles size={14} className="text-term-cyan" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-term-cyan">{totalCompletionsEver}</span>
            <span className="text-xs text-term-text-muted">completions</span>
          </div>
          <div className="text-[11px] text-term-text-dim mt-2 truncate">
            Stored in local db
          </div>
        </div>

        {/* Streak Protection Tokens */}
        <div className="terminal-card rounded-md p-3.5 border border-term-border bg-term-surface">
          <div className="flex items-center justify-between text-xs text-term-text-dim mb-1">
            <span>STREAK_SHIELDS</span>
            <ShieldCheck size={14} className="text-term-purple" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-term-purple">
              {settings.streak_protection_tokens || 0}
            </span>
            <span className="text-xs text-term-text-muted">tokens</span>
          </div>
          <div className="text-[11px] text-term-text-dim mt-2 truncate">
            Protects missed days
          </div>
        </div>
      </div>

      {/* Routine Quick Launcher Banner */}
      <div 
        onClick={onOpenRoutineTab}
        className="terminal-card rounded-md p-3 border border-term-border-strong bg-term-elevated/60 hover:bg-term-elevated transition-colors cursor-pointer flex items-center justify-between text-xs font-mono group"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-term-surface border border-term-border text-term-cyan group-hover:border-term-cyan">
            <Layers size={15} />
          </div>
          <div>
            <span className="font-semibold text-term-text block">
              Activate Focus Routine Mode
            </span>
            <span className="text-term-text-dim text-[11px]">
              Step-by-step sequential routine runner with focus timer
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-term-cyan group-hover:translate-x-1 transition-transform">
          <span>RUN_ROUTINE</span>
          <ArrowRight size={13} />
        </div>
      </div>

      {/* Habit Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 font-mono text-xs">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-term-text-dim text-[11px] mr-1 hidden sm:inline">TAGS:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs border uppercase tracking-wider transition-colors ${
                selectedCategory === cat
                  ? 'bg-term-text text-black font-bold border-term-text'
                  : 'bg-term-surface border-term-border text-term-text-muted hover:border-term-border-strong hover:text-term-text'
              }`}
            >
              #{cat}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-term-surface p-0.5 rounded border border-term-border">
          {(['all', 'pending', 'completed'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded capitalize text-xs transition-colors ${
                statusFilter === status
                  ? 'bg-term-elevated text-term-accent font-semibold border border-term-border'
                  : 'text-term-text-dim hover:text-term-text'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Habit Cards Grid */}
      {displayedHabits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {displayedHabits.map(habit => {
            const log = todayLogsMap.get(habit.id);
            const streak = streakMap.get(habit.id) || {
              currentStreak: 0,
              longestStreak: 0,
              totalCompletions: 0,
              isCompletedToday: false,
              freezeUsedDays: [],
            };

            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                log={log}
                streakInfo={streak}
                onToggleComplete={onToggleComplete}
                onUpdateValue={onUpdateValue}
                onEdit={onEditHabit}
                onArchive={onArchiveHabit}
                onDelete={onDeleteHabit}
                soundEnabled={settings.sound_effects}
              />
            );
          })}
        </div>
      ) : (
        <div className="terminal-card rounded-md border border-term-border p-8 text-center font-mono">
          <div className="text-term-text-dim text-sm mb-2">
            {statusFilter === 'completed'
              ? 'No habits marked completed for today yet.'
              : statusFilter === 'pending'
              ? 'All habits completed! High-five developer.'
              : 'No habits found matching your filter.'}
          </div>
          <button
            onClick={() => onOpenNewHabit()}
            className="mt-3 px-3.5 py-2 rounded bg-term-elevated border border-term-border text-term-accent hover:border-term-accent text-xs font-mono font-semibold"
          >
            + CREATE_NEW_HABIT
          </button>
        </div>
      )}
    </div>
  );
};

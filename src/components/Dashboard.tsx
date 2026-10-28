import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Flame, 
  Trophy, 
  Crown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronRight as ArrowRightIcon,
  Sun,
  Sparkles, 
  Plus, 
  Clock, 
  Edit3, 
  Trash2, 
  Check, 
  BarChart2,
  Laptop,
  GitPullRequest,
  Droplet,
  BookOpen,
  UserCheck,
  Inbox,
  Minus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Habit, HabitLog, StreakInfo, UserSettings } from '../types';
import { 
  getTodayDateString, 
  parseDateString, 
  formatDateString, 
  isHabitDueOnDate 
} from '../lib/dateUtils';
import { playSound } from '../lib/audio';

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

const SUGGESTIONS_COL1 = [
  { title: 'Drink water', icon: '💧', category: 'health', type: 'numeric' as const, target: 8, unit: 'glasses' },
  { title: 'Read 20 pages', icon: '📖', category: 'learn', type: 'boolean' as const, target: 1, unit: 'done' },
  { title: 'Meditate', icon: '🧠', category: 'mind', type: 'timer' as const, target: 15, unit: 'mins' },
  { title: 'Exercise & workout', icon: '🏃', category: 'health', type: 'timer' as const, target: 30, unit: 'mins' },
  { title: 'Sleep 8h', icon: '🛌', category: 'health', type: 'numeric' as const, target: 8, unit: 'hours' },
];

const SUGGESTIONS_COL2 = [
  { title: 'Stretch', icon: '🧘', category: 'health', type: 'timer' as const, target: 10, unit: 'mins' },
  { title: 'Daily journal', icon: '✍️', category: 'mind', type: 'boolean' as const, target: 1, unit: 'done' },
  { title: 'Walk 10k steps', icon: '🚶', category: 'health', type: 'numeric' as const, target: 10000, unit: 'steps' },
  { title: 'Wake up before 8am', icon: '⏰', category: 'routine', type: 'boolean' as const, target: 1, unit: 'done' },
  { title: 'No phone in bed', icon: '📵', category: 'mind', type: 'boolean' as const, target: 1, unit: 'done' },
];

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
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Mini-calendar month state
  const [calMonth, setCalMonth] = useState<Date>(() => {
    const today = parseDateString(todayStr);
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Group today's logs
  const todayLogsMap = useMemo(() => {
    const map = new Map<string, HabitLog>();
    for (const log of logs) {
      if (log.date === todayStr) {
        map.set(log.habit_id, log);
      }
    }
    return map;
  }, [logs, todayStr]);

  // Group logs by date
  const logsByDate = useMemo(() => {
    const map = new Map<string, HabitLog[]>();
    for (const log of logs) {
      if (!map.has(log.date)) map.set(log.date, []);
      map.get(log.date)!.push(log);
    }
    return map;
  }, [logs]);

  // Active unarchived habits due today
  const activeHabitsDueToday = useMemo(() => {
    return habits.filter(h => !h.archived && isHabitDueOnDate(h.frequency, h.custom_days, todayStr));
  }, [habits, todayStr]);

  const totalDue = activeHabitsDueToday.length;
  const completedToday = activeHabitsDueToday.filter(h => {
    return Boolean(todayLogsMap.get(h.id)?.completed);
  }).length;
  const percentage = totalDue > 0 ? Math.round((completedToday / totalDue) * 100) : 0;

  // Max streak
  let maxCurrentStreak = 0;
  for (const s of streakMap.values()) {
    if (s.currentStreak > maxCurrentStreak) maxCurrentStreak = s.currentStreak;
  }

  // Level & XP calculation
  const totalCompletedEver = logs.filter(l => l.completed).length;
  const currentLevel = Math.max(1, Math.floor(totalCompletedEver / 4) + 1);
  const xpInCurrentLevel = (totalCompletedEver % 4) * 25;
  const xpToNext = 100 - xpInCurrentLevel;

  // Header Date String: "Thu, Oct 29, 2026"
  const formattedTodayDate = parseDateString(todayStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay(); // 0 is Sun
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Mon=0 .. Sun=6

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      hasCompleted: boolean;
    }> = [];

    // Prev month padding
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevLastDay - i);
      const dStr = formatDateString(d);
      days.push({
        dateStr: dStr,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        hasCompleted: (logsByDate.get(dStr)?.some(l => l.completed)) || false,
      });
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day);
      const dStr = formatDateString(d);
      days.push({
        dateStr: dStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        hasCompleted: (logsByDate.get(dStr)?.some(l => l.completed)) || false,
      });
    }

    // Trailing days padding
    const remainder = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainder; i++) {
      const d = new Date(year, month + 1, i);
      const dStr = formatDateString(d);
      days.push({
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        hasCompleted: false,
      });
    }

    return days;
  }, [calMonth, todayStr, logsByDate]);

  // Contributions Matrix (7 rows = Mon-Sun, 18 columns = 18 weeks)
  const contributionsGrid = useMemo(() => {
    const today = parseDateString(todayStr);
    const totalWeeks = 18;
    const dayOfWeek = today.getDay(); // 0 Sun
    const convertedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 Mon..6 Sun
    
    // Start totalWeeks ago on Monday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (totalWeeks * 7) + (6 - convertedDay));

    const grid: Array<Array<{ dateStr: string; level: number }>> = [
      [], [], [], [], [], [], []
    ]; // 7 days of week

    const runner = new Date(startDate);
    while (runner <= today) {
      const dStr = formatDateString(runner);
      let dow = runner.getDay();
      dow = dow === 0 ? 6 : dow - 1;

      const dayLogs = logsByDate.get(dStr) || [];
      const completed = dayLogs.filter(l => l.completed).length;

      let level = 0;
      if (completed >= 5) level = 4;
      else if (completed >= 3) level = 3;
      else if (completed >= 2) level = 2;
      else if (completed >= 1) level = 1;

      grid[dow].push({ dateStr: dStr, level });
      runner.setDate(runner.getDate() + 1);
    }

    return grid;
  }, [todayStr, logsByDate]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onOpenNewHabit(quickInput.trim());
    setQuickInput('');
  };

  const getHabitIcon = (title: string, category: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('git') || lower.includes('commit') || lower.includes('pr')) return <GitPullRequest size={16} className="text-term-text-muted" />;
    if (lower.includes('deep work') || lower.includes('code') || lower.includes('arch')) return <Laptop size={16} className="text-term-cyan" />;
    if (lower.includes('water') || lower.includes('drink') || lower.includes('hydrat')) return <Droplet size={16} className="text-sky-400" />;
    if (lower.includes('doc') || lower.includes('book') || lower.includes('read')) return <BookOpen size={16} className="text-term-cyan" />;
    if (lower.includes('stretch') || lower.includes('posture') || lower.includes('yoga')) return <UserCheck size={16} className="text-term-amber" />;
    if (lower.includes('inbox') || lower.includes('email') || lower.includes('task')) return <Inbox size={16} className="text-orange-400" />;
    return <Sparkles size={16} className="text-term-accent" />;
  };

  return (
    <div className="font-mono text-xs text-term-text space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ================= MIDDLE WIDGETS COLUMN (~320px) ================= */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* 1. Today Card */}
          <div className="rounded-2xl border border-term-border bg-term-surface p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-term-text text-sm">
                <div className="w-5 h-5 rounded-md bg-term-accent/20 flex items-center justify-center text-term-accent">
                  <CalendarIcon size={13} />
                </div>
                <span>Today</span>
              </div>
              <span className="text-[11px] text-term-text-muted">
                {formattedTodayDate}
              </span>
            </div>

            {/* Streak & Milestones Stat Boxes */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-term-elevated/70 border border-term-border/80 flex items-center gap-2.5">
                <Flame size={20} className="text-term-amber fill-term-amber/30 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-term-text">
                    {maxCurrentStreak} days
                  </div>
                  <div className="text-[10px] text-term-text-dim">
                    current streak
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-term-elevated/70 border border-term-border/80 flex items-center gap-2.5">
                <Trophy size={18} className="text-yellow-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-term-text">
                    3
                  </div>
                  <div className="text-[10px] text-term-text-dim">
                    milestones
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Progress */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-term-text">Daily Progress</span>
                <span className="text-term-text-muted">{completedToday} / {totalDue}</span>
              </div>
              <div className="w-full bg-term-elevated rounded-full h-2 overflow-hidden border border-term-border">
                <div 
                  className="bg-term-accent h-full transition-all duration-300 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-term-text-dim">
                <span>{percentage}% complete</span>
                <span>Goal: 60%</span>
              </div>
            </div>

            {/* Level Banner */}
            <div className="p-2.5 rounded-xl bg-term-elevated/50 border border-term-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-term-accent">
                <Crown size={14} className="text-yellow-400" />
                <span>Level {currentLevel}</span>
              </div>
              <div className="flex items-center gap-1 text-term-text-dim hover:text-term-text cursor-pointer">
                <span>{xpToNext}xp to next</span>
                <ArrowRightIcon size={12} />
              </div>
            </div>
          </div>

          {/* 2. Calendar Card */}
          <div className="rounded-2xl border border-term-border bg-term-surface p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-term-text text-sm">
                <div className="w-5 h-5 rounded-md bg-term-accent/20 flex items-center justify-center text-term-accent">
                  <CalendarIcon size={13} />
                </div>
                <span>Calendar</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button 
                  onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
                  className="p-1 rounded-md bg-term-elevated hover:bg-term-hover text-term-text-muted hover:text-term-text"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="font-semibold text-term-text">
                  {calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
                  className="p-1 rounded-md bg-term-elevated hover:bg-term-hover text-term-text-muted hover:text-term-text"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-term-text-dim font-bold pb-1">
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
              <span>Su</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {calendarDays.map((d) => {
                const isSelected = d.isToday;
                return (
                  <div
                    key={d.dateStr}
                    className={`py-1.5 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? 'bg-term-accent text-black font-bold shadow-sm'
                        : d.hasCompleted
                        ? 'text-term-accent font-semibold hover:bg-term-elevated'
                        : d.isCurrentMonth
                        ? 'text-term-text-muted hover:bg-term-elevated/40 hover:text-term-text'
                        : 'text-term-text-dim/40'
                    }`}
                  >
                    {d.dayNumber}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Contributions Card */}
          <div className="rounded-2xl border border-term-border bg-term-surface p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-term-text text-sm">
              <div className="w-5 h-5 rounded-md bg-term-accent/20 flex items-center justify-center text-term-accent">
                <BarChart2 size={13} />
              </div>
              <span>Contributions</span>
            </div>

            {/* 7-Row Matrix */}
            <div className="flex gap-2.5 items-center">
              {/* Day Labels */}
              <div className="flex flex-col justify-between text-[9px] text-term-text-dim font-mono h-28 py-0.5 select-none">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Grid */}
              <div className="overflow-x-auto pb-1 scrollbar-none flex-1">
                <div className="grid grid-rows-7 grid-flow-col gap-[3.5px] min-w-[220px]">
                  {contributionsGrid.map((row) =>
                    row.map((cell) => {
                      let cellColor = 'bg-[#101b15] border border-[#16251d]';
                      if (cell.level === 4) cellColor = 'bg-[#39d353] border border-[#34c24d]';
                      else if (cell.level === 3) cellColor = 'bg-[#26a641] border border-[#22953b]';
                      else if (cell.level === 2) cellColor = 'bg-[#006d32] border border-[#005c2a]';
                      else if (cell.level === 1) cellColor = 'bg-[#0e4429] border border-[#0c3922]';

                      return (
                        <div
                          key={cell.dateStr}
                          className={`w-[11px] h-[11px] rounded-[2.5px] transition-colors hover:ring-1 hover:ring-term-accent/70 cursor-pointer ${cellColor}`}
                          title={cell.dateStr}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-term-text-dim pt-2 border-t border-term-border/40 select-none">
              <span>Less</span>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#101b15] border border-[#16251d]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0e4429]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#006d32]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#26a641]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#39d353]" />
              </div>
              <span>More</span>
            </div>
          </div>

        </div>

        {/* ================= RIGHT MAIN COLUMN ================= */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* 1. Daily Habits Card */}
          <div className="rounded-2xl border border-term-border bg-term-surface p-5 space-y-4 shadow-sm">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-term-border pb-3.5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-term-accent/15 border border-term-accent/30 flex items-center justify-center text-term-accent shrink-0 mt-0.5">
                  <Sun size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-base text-term-text tracking-tight">
                    Daily Habits
                  </h2>
                  <p className="text-xs text-term-text-dim italic mt-0.5">
                    The irony of tracking habits: it&apos;s a habit you have to build first.
                  </p>
                </div>
              </div>

              {/* Circular Percentage Ring */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-term-text-muted font-medium">
                  {completedToday}/{totalDue} done
                </span>
                <div className="w-10 h-10 rounded-full border-2 border-term-border flex items-center justify-center text-xs font-bold text-term-text relative">
                  <div 
                    className="absolute inset-0 rounded-full border-2 border-term-accent"
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${percentage >= 25 ? '100% 0%,' : ''} ${percentage >= 50 ? '100% 100%,' : ''} ${percentage >= 75 ? '0% 100%,' : ''} 0% 0%)`
                    }}
                  />
                  <span>{percentage}%</span>
                </div>
              </div>
            </div>

            {/* Habit Rows */}
            <div className="space-y-2.5">
              {activeHabitsDueToday.map((habit) => {
                const log = todayLogsMap.get(habit.id);
                const isCompleted = Boolean(log?.completed);
                const currentValue = log?.value ?? 0;
                const streak = streakMap.get(habit.id) || { currentStreak: 0, longestStreak: 0, totalCompletions: 0, isCompletedToday: false, freezeUsedDays: [] };

                return (
                  <div
                    key={habit.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs ${
                      isCompleted
                        ? 'border-term-accent/40 bg-term-accent/5'
                        : 'border-term-border bg-term-elevated/40 hover:border-term-border-strong hover:bg-term-elevated'
                    }`}
                  >
                    {/* Left: Checkbox + Icon + Title + Tags */}
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => {
                          const next = !isCompleted;
                          if (next) {
                            playSound.complete(settings.sound_effects);
                            try {
                              confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 }, colors: ['#22c55e', '#06b6d4', '#f59e0b'] });
                            } catch { /* ignore */ }
                          } else {
                            playSound.undo(settings.sound_effects);
                          }
                          onToggleComplete(habit.id, next, next ? habit.target_value : 0);
                        }}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                          isCompleted
                            ? 'bg-term-accent text-black border-term-accent shadow-sm'
                            : 'border-term-border-strong bg-term-surface hover:border-term-accent'
                        }`}
                      >
                        {isCompleted && <Check size={13} strokeWidth={3} />}
                      </button>

                      <div className="shrink-0">
                        {getHabitIcon(habit.title, habit.category)}
                      </div>

                      <div className="flex items-center gap-2 truncate">
                        <span className={`font-medium truncate ${isCompleted ? 'line-through text-term-text-muted' : 'text-term-text'}`}>
                          {habit.title}
                        </span>
                        {habit.frequency !== 'daily' && (
                          <span className="text-[10px] text-term-text-dim px-2 py-0.5 rounded-full bg-term-surface border border-term-border shrink-0">
                            {habit.frequency}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Counter / Timer / Streak / Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Timer Badge */}
                      {habit.type === 'timer' && (
                        <button
                          onClick={() => {
                            const next = !isCompleted;
                            onToggleComplete(habit.id, next, next ? habit.target_value : 0);
                          }}
                          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            isCompleted
                              ? 'border-term-accent text-term-accent bg-term-accent/10'
                              : 'border-term-cyan/40 text-term-cyan bg-term-cyan/10 hover:border-term-cyan'
                          }`}
                        >
                          <Clock size={12} />
                          <span>{habit.target_value}m</span>
                        </button>
                      )}

                      {/* Numeric Stepper */}
                      {habit.type === 'numeric' && (
                        <div className="flex items-center gap-1.5 bg-term-surface px-2.5 py-1 rounded-full border border-term-border text-xs">
                          <button
                            onClick={() => onUpdateValue(habit.id, Math.max(0, currentValue - 1))}
                            className="text-term-text-dim hover:text-term-text"
                          >
                            <Minus size={11} />
                          </button>
                          <span className={`font-bold ${isCompleted ? 'text-term-accent' : 'text-term-text'}`}>
                            {currentValue}/{habit.target_value}
                          </span>
                          <button
                            onClick={() => onUpdateValue(habit.id, currentValue + 1)}
                            className="text-term-text-dim hover:text-term-accent"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      )}

                      {/* Streak Badge */}
                      <span className="flex items-center gap-1 text-term-amber font-semibold text-xs">
                        <Flame size={13} className="text-term-amber fill-term-amber/30" />
                        <span>{streak.currentStreak}d</span>
                      </span>

                      {/* Action Icons */}
                      <button
                        onClick={() => onEditHabit(habit)}
                        className="text-term-text-dim hover:text-term-text transition-colors p-1"
                        title="Edit Habit"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete habit "${habit.title}"?`)) onDeleteHabit(habit.id);
                        }}
                        className="text-term-text-dim hover:text-term-red transition-colors p-1"
                        title="Delete Habit"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {activeHabitsDueToday.length === 0 && (
                <div className="py-8 text-center text-term-text-dim text-xs border border-dashed border-term-border rounded-xl">
                  No habits scheduled for today. Add one below!
                </div>
              )}
            </div>

            {/* Quick Add Habit Bar */}
            <form onSubmit={handleQuickAdd} className="pt-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-term-accent/20 border border-term-accent/40 flex items-center justify-center text-term-accent shrink-0">
                <Plus size={14} />
              </div>
              <span className="text-xs font-semibold text-term-text shrink-0 hidden sm:inline">
                Quick Add Habit
              </span>
              <input
                type="text"
                value={quickInput}
                onChange={e => setQuickInput(e.target.value)}
                placeholder="What habit do you want to build?"
                className="flex-1 px-3.5 py-2 rounded-xl bg-term-elevated border border-term-border focus:border-term-accent text-term-text text-xs focus:outline-none"
              />
              <button
                type="submit"
                disabled={!quickInput.trim()}
                className="px-4 py-2 rounded-xl bg-term-accent text-black font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all shrink-0"
              >
                Add Habit
              </button>
            </form>
          </div>

          {/* 2. Suggestions Card */}
          <div className="rounded-2xl border border-term-border bg-term-surface p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-term-text text-sm">
                <Sparkles size={16} className="text-term-accent" />
                <span>Suggestions</span>
              </div>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-xs text-term-text-dim hover:text-term-text"
              >
                {showSuggestions ? 'Hide' : 'Show'}
              </button>
            </div>
            
            <p className="text-xs text-term-text-dim italic">
              Click [add] to quick-start any standard daily ritual.
            </p>

            {showSuggestions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {/* Column 1 */}
                <div className="space-y-2">
                  {SUGGESTIONS_COL1.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-term-border bg-term-elevated/40 flex items-center justify-between text-xs hover:border-term-border-strong"
                    >
                      <div className="flex items-center gap-2.5">
                        <span>{item.icon}</span>
                        <span className="font-medium text-term-text">{item.title}</span>
                      </div>
                      <button
                        onClick={() => {
                          playSound.complete(settings.sound_effects);
                          onOpenNewHabit(`${item.icon} ${item.title}`);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-term-border bg-term-surface hover:border-term-accent text-term-accent font-semibold text-[11px] transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>

                {/* Column 2 */}
                <div className="space-y-2">
                  {SUGGESTIONS_COL2.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-term-border bg-term-elevated/40 flex items-center justify-between text-xs hover:border-term-border-strong"
                    >
                      <div className="flex items-center gap-2.5">
                        <span>{item.icon}</span>
                        <span className="font-medium text-term-text">{item.title}</span>
                      </div>
                      <button
                        onClick={() => {
                          playSound.complete(settings.sound_effects);
                          onOpenNewHabit(`${item.icon} ${item.title}`);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-term-border bg-term-surface hover:border-term-accent text-term-accent font-semibold text-[11px] transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

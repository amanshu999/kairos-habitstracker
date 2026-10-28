import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Flame, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Trash2,
  Edit3,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Minus,
  Sparkles
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

const DEFAULT_SUGGESTIONS = [
  { title: 'drink water', category: 'health', type: 'numeric' as const, target: 8, unit: 'glasses', icon: '💧' },
  { title: 'stretch', category: 'health', type: 'timer' as const, target: 10, unit: 'mins', icon: '🧘' },
  { title: 'read 20 pages', category: 'learn', type: 'boolean' as const, target: 1, unit: 'done', icon: '📖' },
  { title: 'daily journal', category: 'mind', type: 'boolean' as const, target: 1, unit: 'done', icon: '✍' },
  { title: 'meditate', category: 'mind', type: 'timer' as const, target: 15, unit: 'mins', icon: '🧠' },
  { title: 'walk 10k steps', category: 'health', type: 'numeric' as const, target: 10000, unit: 'steps', icon: '🚶' },
  { title: 'exercise & workout', category: 'health', type: 'timer' as const, target: 30, unit: 'mins', icon: '🏃' },
  { title: 'wake up before 8am', category: 'routine', type: 'boolean' as const, target: 1, unit: 'done', icon: '⏰' },
  { title: 'sleep 8h', category: 'health', type: 'numeric' as const, target: 8, unit: 'hours', icon: '🛌' },
  { title: 'no phone in bed', category: 'mind', type: 'boolean' as const, target: 1, unit: 'done', icon: '📵' },
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
  onSetTheme,
  onOpenRoutineTab,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Mini-calendar month state
  const [calMonth, setCalMonth] = useState<Date>(() => {
    const today = parseDateString(todayStr);
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

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

  // Logs grouped by date for mini heatmap and mini calendar
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

  // Completion calculation
  const totalDue = activeHabitsDueToday.length;
  const completedToday = activeHabitsDueToday.filter(h => {
    const log = todayLogsMap.get(h.id);
    return Boolean(log?.completed);
  }).length;
  const percentage = totalDue > 0 ? Math.round((completedToday / totalDue) * 100) : 0;

  // Max streak
  let maxCurrentStreak = 0;
  for (const s of streakMap.values()) {
    if (s.currentStreak > maxCurrentStreak) maxCurrentStreak = s.currentStreak;
  }

  // XP & Gamification Level Calculation
  const totalCompletedEver = logs.filter(l => l.completed).length;
  const currentLevel = Math.floor(totalCompletedEver / 10) + 1;
  const xpInCurrentLevel = (totalCompletedEver % 10) * 10;
  const xpToNext = 100 - xpInCurrentLevel;

  // Date Header String: e.g. "Thursday, October 29, 2026"
  const formattedTodayDate = parseDateString(todayStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Mini Calendar generation (mo, tu, we, th, fr, sa, su)
  const miniCalendarDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay(); // 0 is Sun, 1 is Mon
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // convert to Mon=0 .. Sun=6

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

  // Mini Heatmap generation (past 16 weeks)
  const miniHeatmapData = useMemo(() => {
    const today = parseDateString(todayStr);
    const totalWeeks = 16;
    const dayOfWeek = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (totalWeeks * 7) + (6 - dayOfWeek));

    const weeks: Array<Array<{
      dateStr: string;
      level: 0 | 1 | 2 | 3 | 4;
    }>> = [];

    let currentWeek: Array<{ dateStr: string; level: 0 | 1 | 2 | 3 | 4 }> = [];
    const runner = new Date(startDate);

    while (runner <= today) {
      const dStr = formatDateString(runner);
      const dayLogs = logsByDate.get(dStr) || [];
      const completed = dayLogs.filter(l => l.completed).length;

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (completed >= 5) level = 4;
      else if (completed >= 3) level = 3;
      else if (completed >= 2) level = 2;
      else if (completed >= 1) level = 1;

      currentWeek.push({ dateStr: dStr, level });

      if (runner.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      runner.setDate(runner.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return weeks;
  }, [todayStr, logsByDate]);

  // Filtered habits
  const displayedHabits = useMemo(() => {
    return activeHabitsDueToday.filter(h => {
      if (categoryFilter !== 'all' && h.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [activeHabitsDueToday, categoryFilter]);

  const handleAddSuggestion = (s: typeof DEFAULT_SUGGESTIONS[0]) => {
    playSound.complete(settings.sound_effects);
    onOpenNewHabit(`${s.icon} ${s.title}`);
  };

  return (
    <div className="font-mono text-xs text-term-text space-y-4">
      {/* 2-Column Split: Left Widgets & Right Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* 1. $ status Card */}
          <div className="border border-term-border rounded bg-term-surface p-3.5 space-y-2.5">
            <div className="text-term-accent font-bold text-xs flex items-center gap-1.5">
              <span>$</span>
              <span>status</span>
            </div>

            <div className="text-term-text font-medium text-xs">
              {formattedTodayDate}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-term-accent font-semibold">
                <Flame size={12} className="text-term-accent" />
                <span>{maxCurrentStreak} days</span>
              </span>
              <span className="flex items-center gap-1 text-term-text-muted">
                <ShieldCheck size={12} className="text-term-cyan" />
                <span>{settings.streak_protection_tokens || 0}</span>
              </span>
            </div>

            {/* Progress Bar & Percentage */}
            <div className="space-y-1 pt-1">
              <div className="w-full bg-term-elevated rounded-full h-1.5 overflow-hidden border border-term-border">
                <div 
                  className="bg-term-accent h-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-term-text-dim">
                <span>{percentage}% [{completedToday}/{totalDue}]</span>
                <span>// goal: 60%</span>
              </div>
            </div>

            {/* Gamification Level */}
            <div className="text-[11px] text-term-text-dim border-t border-term-border/60 pt-2 flex items-center justify-between">
              <span>level: <strong className="text-term-accent">{currentLevel}</strong></span>
              <span>[{xpToNext}xp to next]</span>
            </div>
          </div>

          {/* 2. $ calendar Card */}
          <div className="border border-term-border rounded bg-term-surface p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="text-term-accent font-bold flex items-center gap-1.5">
                <span>$</span>
                <span>calendar</span>
              </div>
              <div className="flex items-center gap-1 text-term-text-dim">
                <button 
                  onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
                  className="hover:text-term-text"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="text-[11px] uppercase">
                  {calMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
                  className="hover:text-term-text"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-term-text-dim font-bold pb-1 border-b border-term-border/40">
              <span>mo</span>
              <span>tu</span>
              <span>we</span>
              <span>th</span>
              <span>fr</span>
              <span>sa</span>
              <span>su</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {miniCalendarDays.map((d) => {
                const isSelected = d.isToday;
                return (
                  <div
                    key={d.dateStr}
                    className={`py-1 rounded text-[11px] ${
                      isSelected
                        ? 'bg-term-accent text-black font-bold'
                        : d.hasCompleted
                        ? 'text-term-accent font-semibold'
                        : d.isCurrentMonth
                        ? 'text-term-text-muted hover:text-term-text'
                        : 'text-term-text-dim/40'
                    }`}
                  >
                    {isSelected ? `*${d.dayNumber}` : d.dayNumber}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. $ contributions Card */}
          <div className="border border-term-border rounded bg-term-surface p-3.5 space-y-2">
            <div className="text-term-accent font-bold text-xs flex items-center gap-1.5">
              <span>$</span>
              <span>contributions</span>
            </div>

            <div className="overflow-x-auto pb-1 scrollbar-none">
              <div className="flex gap-1 min-w-[200px]">
                {miniHeatmapData.map((week, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    {week.map((cell) => {
                      let cellColor = 'bg-term-elevated/40 border-term-border/40';
                      if (cell.level === 4) cellColor = 'bg-term-accent border-term-accent';
                      else if (cell.level === 3) cellColor = 'bg-emerald-600 border-emerald-500';
                      else if (cell.level === 2) cellColor = 'bg-emerald-800 border-emerald-700';
                      else if (cell.level === 1) cellColor = 'bg-emerald-950 border-emerald-900';

                      return (
                        <div
                          key={cell.dateStr}
                          className={`w-2.5 h-2.5 rounded-sm border ${cellColor}`}
                          title={cell.dateStr}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-term-text-dim pt-1 border-t border-term-border/40">
              <span>// less</span>
              <div className="flex items-center gap-0.5">
                <span className="w-2 h-2 rounded-xs bg-term-elevated border border-term-border" />
                <span className="w-2 h-2 rounded-xs bg-emerald-950 border border-emerald-900" />
                <span className="w-2 h-2 rounded-xs bg-emerald-800 border border-emerald-700" />
                <span className="w-2 h-2 rounded-xs bg-emerald-600 border border-emerald-500" />
                <span className="w-2 h-2 rounded-xs bg-term-accent border border-term-accent" />
              </div>
              <span>more</span>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN: HABITS ================= */}
        <div className="lg:col-span-8 border border-term-border-strong rounded bg-term-surface p-4 sm:p-5 space-y-4">
          
          {/* Header Prompt */}
          <div className="border-b border-term-border pb-3 space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-xs">
                <span className="text-term-accent font-semibold">{settings.display_name}</span>
                <span className="text-term-text-dim"> $ </span>
                <span className="text-term-text font-bold">daily</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-term-text-dim">
                  {completedToday}/{totalDue} done
                </span>
              </div>
            </div>
            <p className="text-[11px] text-term-text-dim italic">
              // the irony of tracking habits: it&apos;s a habit you have to build first.
            </p>
          </div>

          {/* Active Habits List */}
          <div className="space-y-2">
            {displayedHabits.map((habit) => {
              const log = todayLogsMap.get(habit.id);
              const isCompleted = Boolean(log?.completed);
              const currentValue = log?.value ?? 0;
              const streak = streakMap.get(habit.id) || { currentStreak: 0, longestStreak: 0, totalCompletions: 0, isCompletedToday: false, freezeUsedDays: [] };

              return (
                <div
                  key={habit.id}
                  className={`p-2.5 rounded border transition-colors flex items-center justify-between gap-3 text-xs ${
                    isCompleted
                      ? 'border-term-accent/40 bg-term-accent/5'
                      : 'border-term-border bg-term-elevated/40 hover:border-term-border-strong'
                  }`}
                >
                  {/* Left: Checkbox & Title */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => {
                        const next = !isCompleted;
                        if (next) {
                          playSound.complete(settings.sound_effects);
                          try {
                            confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 }, colors: ['#22c55e', '#06b6d4', '#eab308'] });
                          } catch { /* ignore */ }
                        } else {
                          playSound.undo(settings.sound_effects);
                        }
                        onToggleComplete(habit.id, next, next ? habit.target_value : 0);
                      }}
                      className={`w-4 h-4 rounded-xs border flex items-center justify-center font-bold text-[10px] transition-colors shrink-0 ${
                        isCompleted
                          ? 'bg-term-accent text-black border-term-accent'
                          : 'border-term-border-strong bg-term-surface hover:border-term-accent'
                      }`}
                    >
                      {isCompleted ? <Check size={11} strokeWidth={3} /> : ''}
                    </button>

                    <div className="truncate">
                      <span className={`font-medium ${isCompleted ? 'line-through text-term-text-muted' : 'text-term-text'}`}>
                        {habit.title}
                      </span>
                      {habit.frequency !== 'daily' && (
                        <span className="text-[10px] text-term-text-dim ml-1.5">
                          ({habit.frequency})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Counter / Timer badges & actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Numeric +/- buttons */}
                    {habit.type === 'numeric' && (
                      <div className="flex items-center gap-1 bg-term-surface px-1.5 py-0.5 rounded border border-term-border text-[11px]">
                        <button
                          onClick={() => onUpdateValue(habit.id, Math.max(0, currentValue - 1))}
                          className="text-term-text-dim hover:text-term-text px-1"
                        >
                          -
                        </button>
                        <span className={`font-mono font-bold ${isCompleted ? 'text-term-accent' : 'text-term-text'}`}>
                          {currentValue}/{habit.target_value}
                        </span>
                        <button
                          onClick={() => onUpdateValue(habit.id, currentValue + 1)}
                          className="text-term-text-dim hover:text-term-accent px-1"
                        >
                          +
                        </button>
                      </div>
                    )}

                    {/* Timer mode badge */}
                    {habit.type === 'timer' && (
                      <button
                        onClick={() => {
                          const next = !isCompleted;
                          onToggleComplete(habit.id, next, next ? habit.target_value : 0);
                        }}
                        className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border ${
                          isCompleted
                            ? 'border-term-accent text-term-accent bg-term-accent/10'
                            : 'border-term-cyan/40 text-term-cyan'
                        }`}
                      >
                        <Clock size={11} />
                        <span>{habit.target_value}m</span>
                      </button>
                    )}

                    {/* Streak badge */}
                    <span 
                      className="text-[11px] text-term-amber flex items-center gap-0.5"
                      title={`Streak: ${streak.currentStreak} days`}
                    >
                      <Flame size={11} />
                      <span>{streak.currentStreak}d</span>
                    </span>

                    {/* Edit menu */}
                    <button
                      onClick={() => onEditHabit(habit)}
                      className="text-term-text-dim hover:text-term-text p-1"
                      title="Edit"
                    >
                      <Edit3 size={11} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete habit "${habit.title}"?`)) onDeleteHabit(habit.id);
                      }}
                      className="text-term-text-dim hover:text-term-red p-1"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })}

            {displayedHabits.length === 0 && (
              <div className="py-6 text-center text-term-text-dim text-xs border border-dashed border-term-border rounded">
                // no habits due for today.
              </div>
            )}
          </div>

          {/* Quick Suggestions / Library Section */}
          <div className="pt-3 border-t border-term-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-term-accent font-bold text-xs flex items-center gap-1">
                <span>$</span>
                <span>suggestions</span>
              </span>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-[11px] text-term-text-dim hover:text-term-text"
              >
                {showSuggestions ? '[hide]' : '[expand]'}
              </button>
            </div>

            {showSuggestions && (
              <div className="space-y-1 text-xs">
                <p className="text-[11px] text-term-text-dim italic">
                  // click [add] to quick-start any standard daily ritual.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {DEFAULT_SUGGESTIONS.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded border border-term-border bg-term-elevated/20 flex items-center justify-between text-xs hover:border-term-border-strong"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-term-text-dim text-[11px]">[ ]</span>
                        <span className="mr-1">{item.icon}</span>
                        <span className="truncate text-term-text">{item.title}</span>
                      </div>
                      <button
                        onClick={() => handleAddSuggestion(item)}
                        className="text-term-accent hover:underline font-bold text-[11px] shrink-0 ml-2"
                      >
                        [add]
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-3 border-t border-term-border flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenNewHabit()}
                className="px-2.5 py-1 rounded bg-term-accent text-black font-bold text-xs hover:opacity-90 flex items-center gap-1"
              >
                <Plus size={12} strokeWidth={3} />
                <span>+ habit</span>
              </button>
              <button
                onClick={onOpenRoutineTab}
                className="px-2.5 py-1 rounded bg-term-elevated border border-term-border hover:border-term-accent text-term-text text-xs"
              >
                + routine
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-term-text-dim">
              <button 
                onClick={() => setCategoryFilter(categoryFilter === 'all' ? 'health' : categoryFilter === 'health' ? 'dev' : 'all')}
                className="hover:text-term-text"
              >
                [filter: {categoryFilter}]
              </button>
              <span>·</span>
              <button 
                onClick={() => onOpenNewHabit()}
                className="hover:text-term-accent"
              >
                [custom]
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

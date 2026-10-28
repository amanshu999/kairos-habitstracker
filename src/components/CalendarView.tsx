import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Clock, 
  Hash, 
  Layers,
  AlertCircle
} from 'lucide-react';
import { Habit, HabitLog, UserSettings } from '../types';
import { 
  getTodayDateString, 
  parseDateString, 
  formatDateString, 
  isHabitDueOnDate 
} from '../lib/dateUtils';
import { playSound } from '../lib/audio';

interface CalendarViewProps {
  habits: Habit[];
  logs: HabitLog[];
  todayStr: string;
  settings: UserSettings;
  onToggleCompleteHabit: (habitId: string, currentStatus: boolean, value?: number, targetDate?: string) => void;
  onUpdateValueHabit: (habitId: string, newValue: number, targetDate?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  habits,
  logs,
  todayStr,
  settings,
  onToggleCompleteHabit,
  onUpdateValueHabit,
}) => {
  // Current viewed month and year
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const today = parseDateString(todayStr);
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Selected day for side panel detail view
  const [selectedDayStr, setSelectedDayStr] = useState<string>(todayStr);

  // Group logs by date
  const logsByDate = useMemo(() => {
    const map = new Map<string, Map<string, HabitLog>>();
    for (const log of logs) {
      if (!map.has(log.date)) map.set(log.date, new Map());
      map.get(log.date)!.set(log.habit_id, log);
    }
    return map;
  }, [logs]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    const today = parseDateString(todayStr);
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDayStr(todayStr);
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isFuture: boolean;
      completedCount: number;
      totalDue: number;
      status: 'full' | 'partial' | 'missed' | 'empty' | 'future';
    }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dStr = formatDateString(d);
      days.push({
        dateStr: dStr,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isFuture: dStr > todayStr,
        completedCount: 0,
        totalDue: 0,
        status: 'empty',
      });
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      const dStr = formatDateString(d);
      const isFuture = dStr > todayStr;
      const isToday = dStr === todayStr;

      const dueHabits = habits.filter(h => !h.archived && isHabitDueOnDate(h.frequency, h.custom_days, dStr));
      const totalDue = dueHabits.length;

      const dayLogs = logsByDate.get(dStr);
      let completedCount = 0;
      if (dayLogs) {
        for (const h of dueHabits) {
          if (dayLogs.get(h.id)?.completed) {
            completedCount++;
          }
        }
      }

      let status: 'full' | 'partial' | 'missed' | 'empty' | 'future' = 'empty';
      if (isFuture) {
        status = 'future';
      } else if (totalDue === 0) {
        status = 'empty';
      } else if (completedCount === totalDue) {
        status = 'full';
      } else if (completedCount > 0) {
        status = 'partial';
      } else {
        status = 'missed';
      }

      days.push({
        dateStr: dStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday,
        isFuture,
        completedCount,
        totalDue,
        status,
      });
    }

    // Trailing days padding to complete grid
    const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length > 0 ? 42 - days.length : 0);
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dStr = formatDateString(d);
      days.push({
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isFuture: dStr > todayStr,
        completedCount: 0,
        totalDue: 0,
        status: 'future',
      });
    }

    return days;
  }, [currentMonth, todayStr, habits, logsByDate]);

  // Selected Day Details
  const selectedDayData = useMemo(() => {
    const dueHabits = habits.filter(h => !h.archived && isHabitDueOnDate(h.frequency, h.custom_days, selectedDayStr));
    const dayLogs = logsByDate.get(selectedDayStr);
    return {
      dueHabits,
      dayLogs: dayLogs || new Map(),
    };
  }, [habits, selectedDayStr, logsByDate]);

  const monthYearLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-term-border">
        <div>
          <h1 className="text-xl font-bold text-term-text flex items-center gap-2">
            <CalendarIcon className="text-term-accent" size={20} />
            <span>CALENDAR_MATRIX</span>
          </h1>
          <p className="text-xs text-term-text-muted mt-0.5">
            Audit historical logs, review consistency, and backfill completions
          </p>
        </div>

        {/* Month Navigator Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleJumpToToday}
            className="px-2.5 py-1 rounded bg-term-elevated border border-term-border text-term-accent hover:border-term-accent text-xs font-bold"
          >
            TODAY
          </button>
          <div className="flex items-center gap-1 bg-term-surface border border-term-border rounded p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-term-elevated text-term-text-muted hover:text-term-text"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold px-2 text-term-text min-w-[130px] text-center uppercase tracking-wide">
              {monthYearLabel}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-term-elevated text-term-text-muted hover:text-term-text"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Grid Table */}
        <div className="lg:col-span-2 terminal-card rounded-md border border-term-border bg-term-surface p-4 sm:p-5">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-term-text-dim font-bold pb-2 border-b border-term-border">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mt-2">
            {calendarDays.map((day) => {
              const isSelected = day.dateStr === selectedDayStr;

              let cellStyle = 'bg-term-elevated/20 border-term-border/40 text-term-text-dim';
              if (day.isCurrentMonth) {
                if (day.status === 'full') {
                  cellStyle = 'bg-emerald-950/60 border-emerald-500/70 text-emerald-300 font-bold';
                } else if (day.status === 'partial') {
                  cellStyle = 'bg-amber-950/40 border-amber-600/60 text-amber-300 font-semibold';
                } else if (day.status === 'missed') {
                  cellStyle = 'bg-rose-950/20 border-rose-900/40 text-rose-300/80';
                } else if (day.status === 'future') {
                  cellStyle = 'bg-term-elevated/10 border-term-border/30 text-term-text-dim/40';
                } else {
                  cellStyle = 'bg-term-surface border-term-border text-term-text-muted';
                }
              }

              return (
                <div
                  key={day.dateStr}
                  onClick={() => {
                    playSound.click(settings.sound_effects);
                    setSelectedDayStr(day.dateStr);
                  }}
                  className={`min-h-[64px] sm:min-h-[76px] p-1.5 sm:p-2 rounded border cursor-pointer transition-all flex flex-col justify-between relative group ${cellStyle} ${
                    isSelected ? 'ring-2 ring-term-accent border-term-accent' : 'hover:border-term-border-strong'
                  } ${!day.isCurrentMonth ? 'opacity-30' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${day.isToday ? 'px-1.5 py-0.5 rounded bg-term-accent text-black font-bold' : ''}`}>
                      {day.dayNumber}
                    </span>

                    {/* Status badge dot */}
                    {day.isCurrentMonth && !day.isFuture && day.totalDue > 0 && (
                      <span className="text-[10px] font-mono">
                        {day.completedCount}/{day.totalDue}
                      </span>
                    )}
                  </div>

                  {/* Visual Status Indicator Bar */}
                  {day.isCurrentMonth && !day.isFuture && day.totalDue > 0 && (
                    <div className="w-full bg-black/40 rounded-full h-1 overflow-hidden mt-1">
                      <div
                        className={`h-full ${
                          day.status === 'full'
                            ? 'bg-emerald-400'
                            : day.status === 'partial'
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((day.completedCount / day.totalDue) * 100))}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-term-text-dim mt-4 pt-3 border-t border-term-border flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              <span>All Complete (100%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Missed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-term-accent inline-block" />
              <span>Selected Day</span>
            </div>
          </div>
        </div>

        {/* Selected Day Inspector / Editor Panel */}
        <div className="terminal-card rounded-md border border-term-border bg-term-surface p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-term-border mb-4">
              <div>
                <span className="text-xs text-term-text-dim font-bold block">
                  AUDIT_DATE
                </span>
                <span className="text-base font-bold text-term-accent">
                  {selectedDayStr} {selectedDayStr === todayStr && '(TODAY)'}
                </span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-term-elevated border border-term-border text-term-text-muted">
                {selectedDayData.dueHabits.length} habits due
              </span>
            </div>

            {selectedDayStr > todayStr && (
              <div className="p-3 mb-4 rounded bg-term-elevated border border-term-amber/30 text-term-amber text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>This date is in the future.</span>
              </div>
            )}

            {/* Habit Checklist for Selected Day */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {selectedDayData.dueHabits.map((habit) => {
                const log = selectedDayData.dayLogs.get(habit.id);
                const isCompleted = Boolean(log?.completed);
                const currentValue = log?.value ?? 0;

                return (
                  <div
                    key={habit.id}
                    className={`p-3 rounded border text-xs transition-colors ${
                      isCompleted
                        ? 'border-term-accent/40 bg-term-accent-dim/40'
                        : 'border-term-border bg-term-elevated'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`font-semibold truncate ${isCompleted ? 'text-term-accent line-through' : 'text-term-text'}`}>
                        {habit.title}
                      </span>
                      <button
                        onClick={() => {
                          const nextStatus = !isCompleted;
                          if (nextStatus) playSound.complete(settings.sound_effects);
                          else playSound.undo(settings.sound_effects);
                          onToggleCompleteHabit(habit.id, nextStatus, nextStatus ? habit.target_value : 0, selectedDayStr);
                        }}
                        className={`w-5 h-5 rounded flex items-center justify-center border text-[11px] ${
                          isCompleted
                            ? 'bg-term-accent text-black border-term-accent font-bold'
                            : 'border-term-border bg-term-surface text-transparent hover:border-term-accent'
                        }`}
                        title="Toggle completion for this date"
                      >
                        <Check size={12} strokeWidth={3} className={isCompleted ? 'opacity-100' : 'opacity-0'} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-term-text-dim">
                      <span>#{habit.category} // {habit.type}</span>
                      <span>Target: {habit.target_value} {habit.unit || ''}</span>
                    </div>

                    {/* Numeric step adjuster if numeric */}
                    {habit.type === 'numeric' && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-term-border/40">
                        <span className="text-[11px] text-term-text-muted">
                          Logged: {currentValue} / {habit.target_value}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onUpdateValueHabit(habit.id, Math.max(0, currentValue - 1), selectedDayStr)}
                            className="px-1.5 py-0.5 rounded bg-term-surface border border-term-border text-term-text hover:text-term-accent"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => onUpdateValueHabit(habit.id, currentValue + 1, selectedDayStr)}
                            className="px-1.5 py-0.5 rounded bg-term-surface border border-term-border text-term-text hover:text-term-accent"
                          >
                            +1
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {selectedDayData.dueHabits.length === 0 && (
                <div className="text-center py-8 text-term-text-dim text-xs">
                  No habits scheduled for this day.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-term-border text-[11px] text-term-text-dim text-center">
            Changes made here update historical streaks instantly.
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Play, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Layers, 
  Clock, 
  ChevronRight, 
  X, 
  Check, 
  Sparkles,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Habit, HabitLog, Routine, UserSettings } from '../types';
import { playSound } from '../lib/audio';

interface RoutinesViewProps {
  routines: Routine[];
  habits: Habit[];
  logs: HabitLog[];
  todayStr: string;
  settings: UserSettings;
  onSaveRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onToggleCompleteHabit: (habitId: string, currentStatus: boolean, value?: number) => void;
}

export const RoutinesView: React.FC<RoutinesViewProps> = ({
  routines,
  habits,
  logs,
  todayStr,
  settings,
  onSaveRoutine,
  onDeleteRoutine,
  onToggleCompleteHabit,
}) => {
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);

  // Focus Mode / Active Routine Runner State
  const [activeRunningRoutine, setActiveRunningRoutine] = useState<Routine | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Map today's logs
  const todayLogsMap = new Map<string, HabitLog>();
  logs.forEach(l => {
    if (l.date === todayStr) todayLogsMap.set(l.habit_id, l);
  });

  const habitsMap = new Map<string, Habit>(habits.map(h => [h.id, h]));

  const handleToggleHabitSelection = (id: string) => {
    if (selectedHabitIds.includes(id)) {
      setSelectedHabitIds(selectedHabitIds.filter(hId => hId !== id));
    } else {
      setSelectedHabitIds([...selectedHabitIds, id]);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;

    const newRoutine: Routine = {
      id: `r-${Date.now()}`,
      name: newRoutineName.trim(),
      description: newRoutineDesc.trim() || undefined,
      habit_ids: selectedHabitIds,
      created_at: new Date().toISOString(),
    };

    onSaveRoutine(newRoutine);
    setNewRoutineName('');
    setNewRoutineDesc('');
    setSelectedHabitIds([]);
    setIsCreatingRoutine(false);
  };

  const startRoutineRunner = (routine: Routine) => {
    playSound.click(settings.sound_effects);
    setActiveRunningRoutine(routine);
    setCurrentStepIndex(0);
  };

  const finishRoutineRunner = () => {
    playSound.success(settings.sound_effects);
    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#bd93f9', '#f59e0b'],
      });
    } catch {
      // ignore
    }
    setActiveRunningRoutine(null);
  };

  // Active step habit in runner
  const activeHabitInRunner = activeRunningRoutine
    ? habitsMap.get(activeRunningRoutine.habit_ids[currentStepIndex])
    : null;

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-term-border">
        <div>
          <h1 className="text-xl font-bold text-term-text flex items-center gap-2">
            <Layers className="text-term-accent" size={20} />
            <span>ROUTINES_MANAGER</span>
          </h1>
          <p className="text-xs text-term-text-muted mt-0.5">
            Group habits into organized pipelines and execute them in focus sequence
          </p>
        </div>

        <button
          onClick={() => setIsCreatingRoutine(true)}
          className="px-3.5 py-1.5 rounded bg-term-accent text-black font-bold text-xs flex items-center gap-1.5 hover:opacity-90 self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>NEW_ROUTINE</span>
        </button>
      </div>

      {/* Routine Creation Modal/Drawer */}
      {isCreatingRoutine && (
        <div className="terminal-card rounded-md border border-term-accent/50 bg-term-surface p-4 sm:p-5 shadow-xl animate-slide-down">
          <div className="flex items-center justify-between pb-3 border-b border-term-border mb-4">
            <span className="font-bold text-sm text-term-accent">
              $ routine-cli --create
            </span>
            <button
              onClick={() => setIsCreatingRoutine(false)}
              className="p-1 rounded text-term-text-muted hover:text-term-text"
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-term-text-muted mb-1 font-semibold">
                ROUTINE_NAME *
              </label>
              <input
                type="text"
                required
                value={newRoutineName}
                onChange={e => setNewRoutineName(e.target.value)}
                placeholder="e.g., Morning Boot Sequence, Deep Work Ritual"
                className="w-full px-3 py-2 rounded bg-term-elevated border border-term-border focus:border-term-accent text-term-text focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-term-text-muted mb-1">
                DESCRIPTION (OPTIONAL)
              </label>
              <input
                type="text"
                value={newRoutineDesc}
                onChange={e => setNewRoutineDesc(e.target.value)}
                placeholder="e.g., Execute before reviewing emails or checking notifications"
                className="w-full px-3 py-2 rounded bg-term-elevated border border-term-border focus:border-term-accent text-term-text focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-term-text-muted mb-1.5 font-semibold">
                SELECT_HABITS ({selectedHabitIds.length} selected)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-term-elevated/40 rounded border border-term-border">
                {habits.filter(h => !h.archived).map(habit => {
                  const isChecked = selectedHabitIds.includes(habit.id);
                  return (
                    <div
                      key={habit.id}
                      onClick={() => handleToggleHabitSelection(habit.id)}
                      className={`p-2 rounded border cursor-pointer flex items-center justify-between transition-colors ${
                        isChecked
                          ? 'border-term-accent bg-term-accent-dim text-term-accent'
                          : 'border-term-border bg-term-surface text-term-text hover:border-term-border-strong'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                          isChecked ? 'bg-term-accent text-black border-term-accent' : 'border-term-border'
                        }`}>
                          {isChecked && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span className="truncate text-xs font-semibold">{habit.title}</span>
                      </div>
                      <span className="text-[10px] text-term-text-dim px-1.5 py-0.5 rounded bg-term-elevated border border-term-border">
                        #{habit.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-term-border">
              <button
                type="button"
                onClick={() => setIsCreatingRoutine(false)}
                className="px-3 py-1.5 rounded bg-term-elevated border border-term-border text-term-text-muted hover:text-term-text"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={!newRoutineName.trim()}
                className="px-4 py-1.5 rounded bg-term-accent text-black font-bold disabled:opacity-50 hover:opacity-90"
              >
                SAVE_ROUTINE
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Routine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routines.map(routine => {
          const routineHabits = routine.habit_ids
            .map(id => habitsMap.get(id))
            .filter((h): h is Habit => Boolean(h));

          const completedCount = routineHabits.filter(h => {
            const log = todayLogsMap.get(h.id);
            return Boolean(log?.completed);
          }).length;

          const totalHabits = routineHabits.length;
          const progressPercent = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
          const isAllDone = totalHabits > 0 && completedCount === totalHabits;

          return (
            <div
              key={routine.id}
              className={`terminal-card rounded-md border p-4 flex flex-col justify-between transition-all ${
                isAllDone
                  ? 'border-term-accent/40 bg-term-surface/90 shadow-[0_0_12px_rgba(16,185,129,0.08)]'
                  : 'border-term-border bg-term-surface hover:border-term-border-strong'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm text-term-text flex items-center gap-1.5">
                    <span className="text-term-accent">&gt;</span>
                    {routine.name}
                  </h3>
                  <button
                    onClick={() => {
                      if (confirm(`Delete routine "${routine.name}"?`)) {
                        onDeleteRoutine(routine.id);
                      }
                    }}
                    className="p-1 rounded text-term-text-dim hover:text-term-red"
                    title="Delete Routine"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {routine.description && (
                  <p className="text-xs text-term-text-dim line-clamp-2 mb-3">
                    {routine.description}
                  </p>
                )}

                {/* Habits list preview */}
                <div className="space-y-1.5 mb-4">
                  {routineHabits.map((habit, idx) => {
                    const isDone = Boolean(todayLogsMap.get(habit.id)?.completed);
                    return (
                      <div
                        key={habit.id}
                        onClick={() => {
                          const next = !isDone;
                          onToggleCompleteHabit(habit.id, next, next ? habit.target_value : 0);
                        }}
                        className={`text-xs p-1.5 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                          isDone
                            ? 'border-term-accent/30 bg-term-accent-dim text-term-text-muted line-through'
                            : 'border-term-border bg-term-elevated text-term-text hover:border-term-border-strong'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] text-term-text-dim">[{idx + 1}]</span>
                          <span className="truncate">{habit.title}</span>
                        </div>
                        <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                          isDone ? 'bg-term-accent text-black font-bold' : 'border border-term-border'
                        }`}>
                          {isDone && <Check size={11} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                  {routineHabits.length === 0 && (
                    <div className="text-xs text-term-text-dim italic">
                      No habits in this routine yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Progress and Start Action */}
              <div className="pt-3 border-t border-term-border">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-term-text-muted">
                    Execution: <strong className={isAllDone ? 'text-term-accent' : 'text-term-text'}>{completedCount}/{totalHabits}</strong>
                  </span>
                  <span className="text-term-text-dim">{progressPercent}%</span>
                </div>

                <div className="w-full bg-term-elevated rounded-full h-1 overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-300 ${isAllDone ? 'bg-term-accent' : 'bg-term-cyan'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <button
                  onClick={() => startRoutineRunner(routine)}
                  disabled={routineHabits.length === 0}
                  className="w-full py-2 rounded bg-term-elevated hover:bg-term-hover border border-term-border hover:border-term-accent text-term-text font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <Play size={13} className="text-term-accent" />
                  <span>START_FOCUS_MODE</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Routine Focus Runner Modal */}
      {activeRunningRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono">
          <div className="terminal-card bg-term-surface border border-term-accent rounded-lg max-w-xl w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-term-border mb-6">
              <div className="flex items-center gap-2">
                <Maximize2 size={16} className="text-term-accent animate-pulse" />
                <span className="font-bold text-sm text-term-text">
                  FOCUS_RUNNER: {activeRunningRoutine.name}
                </span>
              </div>
              <button
                onClick={() => setActiveRunningRoutine(null)}
                className="p-1 rounded text-term-text-dim hover:text-term-text hover:bg-term-elevated"
              >
                <X size={16} />
              </button>
            </div>

            {/* Stepper indicator */}
            <div className="flex items-center justify-between text-xs text-term-text-muted mb-4">
              <span>
                STEP {currentStepIndex + 1} OF {activeRunningRoutine.habit_ids.length}
              </span>
              <span className="text-term-accent font-semibold">
                {Math.round(((currentStepIndex) / activeRunningRoutine.habit_ids.length) * 100)}% COMPLETE
              </span>
            </div>

            {/* Step Content */}
            {activeHabitInRunner ? (
              <div className="p-6 rounded-lg bg-term-elevated border border-term-border text-center space-y-4">
                <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-term-surface border border-term-border text-term-cyan">
                  #{activeHabitInRunner.category} // {activeHabitInRunner.type}
                </span>

                <h2 className="text-xl sm:text-2xl font-bold text-term-text">
                  {activeHabitInRunner.title}
                </h2>

                {activeHabitInRunner.description && (
                  <p className="text-xs text-term-text-muted max-w-md mx-auto">
                    {activeHabitInRunner.description}
                  </p>
                )}

                {/* Target badge */}
                <div className="text-sm font-semibold text-term-accent">
                  Target: {activeHabitInRunner.target_value} {activeHabitInRunner.unit || 'units'}
                </div>

                {/* Actions */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      // Mark complete
                      onToggleCompleteHabit(activeHabitInRunner.id, true, activeHabitInRunner.target_value);
                      playSound.complete(settings.sound_effects);

                      // Next step or finish
                      if (currentStepIndex < activeRunningRoutine.habit_ids.length - 1) {
                        setCurrentStepIndex(currentStepIndex + 1);
                      } else {
                        finishRoutineRunner();
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded bg-term-accent text-black font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-md"
                  >
                    <Check size={16} strokeWidth={3} />
                    <span>MARK_COMPLETE &amp; ADVANCE</span>
                  </button>

                  {currentStepIndex < activeRunningRoutine.habit_ids.length - 1 ? (
                    <button
                      onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded bg-term-surface border border-term-border text-term-text-muted hover:text-term-text text-xs"
                    >
                      SKIP_STEP &gt;
                    </button>
                  ) : (
                    <button
                      onClick={finishRoutineRunner}
                      className="w-full sm:w-auto px-4 py-2.5 rounded bg-term-surface border border-term-border text-term-text-muted hover:text-term-text text-xs"
                    >
                      FINISH_ROUTINE
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle size={40} className="text-term-accent mx-auto mb-3" />
                <h3 className="text-lg font-bold text-term-text">Routine Complete!</h3>
                <p className="text-xs text-term-text-muted mt-1 mb-4">
                  All routine steps executed. Great work staying disciplined.
                </p>
                <button
                  onClick={finishRoutineRunner}
                  className="px-5 py-2 rounded bg-term-accent text-black font-bold text-xs"
                >
                  CLOSE_SESSION
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

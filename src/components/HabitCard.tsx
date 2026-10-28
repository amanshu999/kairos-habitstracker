import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Plus, 
  Minus, 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Archive,
  Clock,
  Hash,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Habit, HabitLog, StreakInfo } from '../types';
import { playSound } from '../lib/audio';

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  streakInfo: StreakInfo;
  onToggleComplete: (habitId: string, currentStatus: boolean, value?: number) => void;
  onUpdateValue: (habitId: string, newValue: number) => void;
  onEdit: (habit: Habit) => void;
  onArchive: (habitId: string) => void;
  onDelete: (habitId: string) => void;
  soundEnabled: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  log,
  streakInfo,
  onToggleComplete,
  onUpdateValue,
  onEdit,
  onArchive,
  onDelete,
  soundEnabled,
}) => {
  const isCompleted = Boolean(log?.completed);
  const currentValue = log?.value ?? 0;
  const target = habit.target_value || 1;

  // Timer states
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState(
    Math.max(0, (target - currentValue) * 60)
  );
  const timerRef = useRef<any>(null);

  // Menu state
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update timer seconds when currentValue or target changes externally
  useEffect(() => {
    if (!isTimerRunning) {
      setTimerSecondsRemaining(Math.max(0, (target - currentValue) * 60));
    }
  }, [currentValue, target, isTimerRunning]);

  // Timer interval effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            // Timer finished!
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const fireCelebration = () => {
    playSound.complete(soundEnabled);
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#38bdf8'],
      });
    } catch {
      // ignore
    }
  };

  const handleCheckboxToggle = () => {
    const nextStatus = !isCompleted;
    if (nextStatus) {
      fireCelebration();
    } else {
      playSound.undo(soundEnabled);
    }
    onToggleComplete(habit.id, nextStatus, nextStatus ? 1 : 0);
  };

  const handleIncrementNumeric = (delta: number) => {
    const updated = Math.max(0, currentValue + delta);
    const nextCompleted = updated >= target;
    if (nextCompleted && !isCompleted) {
      fireCelebration();
    } else {
      playSound.click(soundEnabled);
    }
    onUpdateValue(habit.id, updated);
  };

  const handleTimerComplete = () => {
    fireCelebration();
    onToggleComplete(habit.id, true, target);
  };

  const toggleTimer = () => {
    playSound.click(soundEnabled);
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    playSound.click(soundEnabled);
    setIsTimerRunning(false);
    setTimerSecondsRemaining(target * 60);
  };

  // Format seconds mm:ss
  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Category badge colors
  const categoryColors: Record<string, string> = {
    dev: 'text-term-accent border-term-accent/30 bg-term-accent/10',
    focus: 'text-term-cyan border-term-cyan/30 bg-term-cyan/10',
    health: 'text-term-amber border-term-amber/30 bg-term-amber/10',
    learn: 'text-term-purple border-term-purple/30 bg-term-purple/10',
    mind: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
  };
  const categoryStyle = categoryColors[habit.category.toLowerCase()] || 'text-term-text-muted border-term-border bg-term-elevated';

  // Progress percentage for numeric and timer
  const numericPercent = Math.min(100, Math.round((currentValue / target) * 100));

  return (
    <div 
      className={`terminal-card rounded-md border p-3.5 sm:p-4 transition-all duration-200 relative group ${
        isCompleted
          ? 'border-term-accent/40 bg-term-surface/80 shadow-[0_0_12px_rgba(16,185,129,0.06)]'
          : 'border-term-border bg-term-surface hover:border-term-border-strong'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Checkbox / Action Trigger */}
        <div className="pt-0.5">
          {habit.type === 'boolean' && (
            <button
              onClick={handleCheckboxToggle}
              className={`w-6 h-6 rounded flex items-center justify-center font-mono border transition-all ${
                isCompleted
                  ? 'bg-term-accent text-black border-term-accent shadow-sm'
                  : 'bg-term-elevated border-term-border-strong hover:border-term-accent text-transparent'
              }`}
              title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            >
              <Check size={14} strokeWidth={3} className={isCompleted ? 'opacity-100' : 'opacity-0'} />
            </button>
          )}

          {habit.type === 'numeric' && (
            <button
              onClick={() => handleIncrementNumeric(currentValue >= target ? -target : target - currentValue)}
              className={`w-6 h-6 rounded flex items-center justify-center font-mono border transition-all text-xs font-bold ${
                isCompleted
                  ? 'bg-term-accent text-black border-term-accent'
                  : 'bg-term-elevated border-term-border-strong text-term-text-muted hover:border-term-accent hover:text-term-accent'
              }`}
              title={isCompleted ? 'Reset count' : 'Complete all'}
            >
              {isCompleted ? <Check size={14} strokeWidth={3} /> : <Hash size={12} />}
            </button>
          )}

          {habit.type === 'timer' && (
            <button
              onClick={toggleTimer}
              className={`w-6 h-6 rounded flex items-center justify-center font-mono border transition-all ${
                isTimerRunning
                  ? 'bg-term-cyan text-black border-term-cyan animate-pulse'
                  : isCompleted
                  ? 'bg-term-accent text-black border-term-accent'
                  : 'bg-term-elevated border-term-border-strong text-term-cyan hover:border-term-cyan'
              }`}
              title={isTimerRunning ? 'Pause timer' : 'Start focus timer'}
            >
              {isTimerRunning ? (
                <Pause size={12} strokeWidth={3} />
              ) : isCompleted ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <Play size={12} strokeWidth={3} className="ml-0.5" />
              )}
            </button>
          )}
        </div>

        {/* Center: Title, Description, Controls */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 
              onClick={() => habit.type === 'boolean' && handleCheckboxToggle()}
              className={`font-mono text-sm font-semibold truncate transition-colors cursor-pointer ${
                isCompleted ? 'text-term-text-muted line-through' : 'text-term-text hover:text-term-accent'
              }`}
            >
              {habit.title}
            </h3>

            {/* Category tag */}
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${categoryStyle}`}>
              #{habit.category}
            </span>

            {/* Frequency tag if not daily */}
            {habit.frequency !== 'daily' && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-term-border text-term-text-dim">
                {habit.frequency}
              </span>
            )}
          </div>

          {habit.description && (
            <p className="text-xs text-term-text-dim line-clamp-1 mb-2 font-mono">
              {habit.description}
            </p>
          )}

          {/* Type-Specific Interactive Body */}
          {habit.type === 'numeric' && (
            <div className="mt-2.5 pt-2 border-t border-term-border/60">
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-term-text-muted">
                  Progress: <strong className={isCompleted ? 'text-term-accent' : 'text-term-text'}>{currentValue}</strong> / {target} {habit.unit || 'units'}
                </span>
                <span className="text-term-text-dim text-[11px] font-semibold">
                  {numericPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-term-elevated rounded-full h-1.5 overflow-hidden border border-term-border mb-2.5">
                <div 
                  className={`h-full transition-all duration-300 ${isCompleted ? 'bg-term-accent' : 'bg-term-cyan'}`}
                  style={{ width: `${numericPercent}%` }}
                />
              </div>

              {/* Numeric Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleIncrementNumeric(-1)}
                  disabled={currentValue <= 0}
                  className="px-2 py-1 rounded bg-term-elevated border border-term-border hover:border-term-border-strong text-term-text-muted hover:text-term-text disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono flex items-center gap-1"
                >
                  <Minus size={12} />
                  <span>1</span>
                </button>
                <button
                  onClick={() => handleIncrementNumeric(1)}
                  className="px-2 py-1 rounded bg-term-elevated border border-term-border hover:border-term-border-strong text-term-text-muted hover:text-term-accent text-xs font-mono flex items-center gap-1"
                >
                  <Plus size={12} />
                  <span>1 {habit.unit}</span>
                </button>
                {target >= 5 && (
                  <button
                    onClick={() => handleIncrementNumeric(Math.ceil(target / 4))}
                    className="px-2 py-1 rounded bg-term-elevated border border-term-border hover:border-term-border-strong text-term-text-muted hover:text-term-accent text-xs font-mono hidden sm:inline-block"
                  >
                    +{Math.ceil(target / 4)}
                  </button>
                )}
              </div>
            </div>
          )}

          {habit.type === 'timer' && (
            <div className="mt-2.5 pt-2 border-t border-term-border/60">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <div className="flex items-center gap-2">
                  <Clock size={13} className={isTimerRunning ? 'text-term-cyan animate-spin' : 'text-term-text-dim'} />
                  <span className={`text-base font-bold tracking-wider ${isTimerRunning ? 'text-term-cyan' : isCompleted ? 'text-term-accent' : 'text-term-text'}`}>
                    {formatTimer(timerSecondsRemaining)}
                  </span>
                  <span className="text-term-text-dim text-[11px]">
                    / {target} mins target
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleTimer}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1 border transition-all ${
                      isTimerRunning
                        ? 'bg-term-cyan/20 border-term-cyan text-term-cyan'
                        : 'bg-term-elevated border-term-border hover:border-term-cyan text-term-text'
                    }`}
                  >
                    {isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
                    <span>{isTimerRunning ? 'PAUSE' : 'START'}</span>
                  </button>
                  <button
                    onClick={resetTimer}
                    className="p-1 rounded bg-term-elevated border border-term-border hover:border-term-border-strong text-term-text-dim hover:text-term-text"
                    title="Reset Timer"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>

              {/* Timer Progress Bar */}
              <div className="w-full bg-term-elevated rounded-full h-1.5 overflow-hidden border border-term-border">
                <div 
                  className={`h-full transition-all duration-300 ${isCompleted ? 'bg-term-accent' : 'bg-term-cyan'}`}
                  style={{ 
                    width: `${Math.min(100, Math.round(((target * 60 - timerSecondsRemaining) / (target * 60)) * 100))}%` 
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Streak & Actions */}
        <div className="flex items-center gap-2 self-start">
          {/* Streak indicator */}
          <div 
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${
              streakInfo.currentStreak > 0
                ? 'bg-term-amber/10 border-term-amber/30 text-term-amber font-semibold'
                : 'bg-term-elevated/40 border-term-border text-term-text-dim'
            }`}
            title={`Current Streak: ${streakInfo.currentStreak} days | Longest: ${streakInfo.longestStreak} days`}
          >
            <Flame size={12} className={streakInfo.currentStreak > 0 ? 'text-term-amber fill-term-amber' : 'text-term-text-dim'} />
            <span>{streakInfo.currentStreak}d</span>
          </div>

          {/* Action Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded bg-term-elevated/40 hover:bg-term-elevated text-term-text-dim hover:text-term-text border border-transparent hover:border-term-border transition-colors"
              title="More options"
            >
              <MoreVertical size={14} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-term-surface border border-term-border-strong rounded shadow-2xl py-1 z-30 animate-slide-down font-mono text-xs">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(habit);
                  }}
                  className="w-full px-3 py-1.5 text-left text-term-text hover:bg-term-elevated flex items-center gap-2"
                >
                  <Edit3 size={12} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onArchive(habit.id);
                  }}
                  className="w-full px-3 py-1.5 text-left text-term-text-muted hover:bg-term-elevated flex items-center gap-2"
                >
                  <Archive size={12} />
                  <span>{habit.archived ? 'Unarchive' : 'Archive'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (confirm(`Delete habit "${habit.title}" and all its logs?`)) {
                      onDelete(habit.id);
                    }
                  }}
                  className="w-full px-3 py-1.5 text-left text-term-red hover:bg-term-elevated flex items-center gap-2 border-t border-term-border mt-1 pt-1"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

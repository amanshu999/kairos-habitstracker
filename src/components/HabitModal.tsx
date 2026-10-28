import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Hash, Clock, Plus, Save } from 'lucide-react';
import { Habit, HabitType, FrequencyType } from '../types';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => void;
  editingHabit?: Habit | null;
  initialTitle?: string;
}

const CATEGORY_PRESETS = ['dev', 'focus', 'health', 'learn', 'mind', 'routine'];
const DAYS_OF_WEEK = [
  { day: 0, label: 'Sun' },
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingHabit,
  initialTitle = '',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('dev');
  const [type, setType] = useState<HabitType>('boolean');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [unit, setUnit] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title);
      setDescription(editingHabit.description || '');
      setCategory(editingHabit.category);
      setType(editingHabit.type);
      setTargetValue(editingHabit.target_value);
      setUnit(editingHabit.unit || '');
      setFrequency(editingHabit.frequency);
      setCustomDays(editingHabit.custom_days || [1, 2, 3, 4, 5]);
    } else {
      setTitle(initialTitle);
      setDescription('');
      setCategory('dev');
      setType('boolean');
      setTargetValue(1);
      setUnit('');
      setFrequency('daily');
      setCustomDays([1, 2, 3, 4, 5]);
    }
  }, [editingHabit, initialTitle, isOpen]);

  // Adjust default target value and unit when type changes
  const handleTypeSelect = (selectedType: HabitType) => {
    setType(selectedType);
    if (!editingHabit) {
      if (selectedType === 'boolean') {
        setTargetValue(1);
        setUnit('');
      } else if (selectedType === 'numeric') {
        setTargetValue(8);
        setUnit('glasses');
      } else if (selectedType === 'timer') {
        setTargetValue(25);
        setUnit('mins');
      }
    }
  };

  const handleToggleCustomDay = (day: number) => {
    if (customDays.includes(day)) {
      if (customDays.length > 1) {
        setCustomDays(customDays.filter(d => d !== day));
      }
    } else {
      setCustomDays([...customDays, day].sort());
    }
  };

  const handleSubmit = (e?: React.FormEvent | KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: editingHabit ? editingHabit.id : undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      category: category.trim().toLowerCase(),
      type,
      target_value: Number(targetValue) || 1,
      unit: unit.trim() || undefined,
      frequency,
      custom_days: frequency === 'custom' ? customDays : undefined,
      archived: editingHabit ? editingHabit.archived : false,
      order_index: editingHabit ? editingHabit.order_index : 999,
    });
    onClose();
  };

  // Keyboard shortcut Ctrl+Enter to save, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, description, category, type, targetValue, unit, frequency, customDays]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="terminal-card bg-term-surface border border-term-border-strong rounded-lg max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-term-elevated px-4 py-3 border-b border-term-border flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-term-accent inline-block" />
            <h2 className="text-sm font-mono font-bold text-term-text tracking-wide">
              {editingHabit ? '$ habit-cli --edit' : '$ habit-cli --create-new'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-term-text-muted hover:text-term-text hover:bg-term-surface"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 font-mono text-xs space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-term-text-muted mb-1 font-semibold">
              HABIT_TITLE <span className="text-term-accent">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Push Git Commit, 2L Hydration, Deep Work"
              className="w-full px-3 py-2 rounded bg-term-elevated border border-term-border focus:border-term-accent text-term-text text-sm focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-term-text-muted mb-1">
              DESCRIPTION // NOTES (OPTIONAL)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g., Focus session without social media, write clean unit tests..."
              className="w-full px-3 py-2 rounded bg-term-elevated border border-term-border focus:border-term-accent text-term-text focus:outline-none resize-none"
            />
          </div>

          {/* Tracking Type */}
          <div>
            <label className="block text-term-text-muted mb-1.5 font-semibold">
              TRACKING_MODE
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeSelect('boolean')}
                className={`p-2.5 rounded border text-left flex flex-col items-center gap-1.5 transition-all ${
                  type === 'boolean'
                    ? 'bg-term-accent-dim border-term-accent text-term-accent font-bold'
                    : 'bg-term-elevated border-term-border text-term-text-muted hover:border-term-border-strong'
                }`}
              >
                <CheckSquare size={16} />
                <span>Checkbox</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect('numeric')}
                className={`p-2.5 rounded border text-left flex flex-col items-center gap-1.5 transition-all ${
                  type === 'numeric'
                    ? 'bg-term-accent-dim border-term-accent text-term-accent font-bold'
                    : 'bg-term-elevated border-term-border text-term-text-muted hover:border-term-border-strong'
                }`}
              >
                <Hash size={16} />
                <span>Counter</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect('timer')}
                className={`p-2.5 rounded border text-left flex flex-col items-center gap-1.5 transition-all ${
                  type === 'timer'
                    ? 'bg-term-accent-dim border-term-accent text-term-accent font-bold'
                    : 'bg-term-elevated border-term-border text-term-text-muted hover:border-term-border-strong'
                }`}
              >
                <Clock size={16} />
                <span>Stopwatch</span>
              </button>
            </div>
          </div>

          {/* Numeric / Timer Target Details */}
          {type !== 'boolean' && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded bg-term-elevated/40 border border-term-border">
              <div>
                <label className="block text-term-text-muted mb-1">
                  {type === 'timer' ? 'TARGET_MINUTES' : 'TARGET_COUNT'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={targetValue}
                  onChange={e => setTargetValue(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-term-surface border border-term-border focus:border-term-accent text-term-text focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-term-text-muted mb-1">
                  UNIT_LABEL
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder={type === 'timer' ? 'mins' : 'glasses, reps, pages'}
                  className="w-full px-3 py-1.5 rounded bg-term-surface border border-term-border focus:border-term-accent text-term-text focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-term-text-muted mb-1.5 font-semibold">
              CATEGORY_TAG
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CATEGORY_PRESETS.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2 py-1 rounded text-xs border uppercase tracking-wider ${
                    category === cat
                      ? 'bg-term-accent text-black border-term-accent font-bold'
                      : 'bg-term-elevated border-term-border text-term-text-dim hover:text-term-text'
                  }`}
                >
                  #{cat}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Or custom category name..."
              className="w-full px-3 py-1.5 rounded bg-term-elevated border border-term-border text-term-text focus:border-term-accent focus:outline-none"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-term-text-muted mb-1.5 font-semibold">
              SCHEDULE_FREQUENCY
            </label>
            <div className="grid grid-cols-4 gap-1.5 mb-2 text-center">
              {(['daily', 'weekdays', 'weekends', 'custom'] as FrequencyType[]).map(freq => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFrequency(freq)}
                  className={`py-1.5 rounded border capitalize text-xs ${
                    frequency === freq
                      ? 'bg-term-accent text-black border-term-accent font-bold'
                      : 'bg-term-elevated border-term-border text-term-text-muted hover:text-term-text'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>

            {frequency === 'custom' && (
              <div className="flex items-center justify-between gap-1 p-2 bg-term-elevated rounded border border-term-border">
                {DAYS_OF_WEEK.map(({ day, label }) => {
                  const active = customDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleCustomDay(day)}
                      className={`w-8 h-8 rounded text-xs font-mono font-bold border transition-colors ${
                        active
                          ? 'bg-term-accent text-black border-term-accent'
                          : 'bg-term-surface border-term-border text-term-text-dim hover:text-term-text'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-term-border flex items-center justify-between">
            <span className="text-[11px] text-term-text-dim hidden sm:inline">
              [Ctrl+Enter to save, Esc to exit]
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded bg-term-elevated border border-term-border text-term-text-muted hover:text-term-text"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-term-accent text-black font-bold flex items-center gap-1.5 hover:opacity-90 shadow-sm"
              >
                {editingHabit ? <Save size={14} /> : <Plus size={14} />}
                <span>{editingHabit ? 'SAVE_CHANGES' : 'COMMIT_HABIT'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

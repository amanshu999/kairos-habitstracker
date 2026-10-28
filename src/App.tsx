import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Habit, HabitLog, Routine, UserSettings, StreakInfo, ThemeType } from './types';
import { StorageEngine } from './lib/storage';
import { calculateHabitStreak } from './lib/streaks';
import { getTodayDateString } from './lib/dateUtils';
import { getCurrentUser, getSupabaseClient } from './lib/supabase';
import { playSound } from './lib/audio';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RoutinesView } from './components/RoutinesView';
import { AnalyticsView } from './components/AnalyticsView';
import { CalendarView } from './components/CalendarView';
import { HabitModal } from './components/HabitModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { CommandPalette } from './components/CommandPalette';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'routines' | 'analytics' | 'calendar'>('dashboard');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    display_name: 'developer@terminal',
    theme: 'terminal-emerald',
    sound_effects: true,
    crt_effects: false,
    week_starts_on: 'monday',
    streak_protection_tokens: 3,
    timezone: 'UTC',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitPrefillTitle, setHabitPrefillTitle] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Supabase Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Load all data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      await StorageEngine.init();
      const [storedHabits, storedLogs, storedRoutines, storedSettings] = await Promise.all([
        StorageEngine.getHabits(),
        StorageEngine.getAllLogs(),
        StorageEngine.getRoutines(),
        StorageEngine.getSettings(),
      ]);

      setHabits(storedHabits);
      setLogs(storedLogs);
      setRoutines(storedRoutines);
      setSettings(storedSettings);
    } catch (err) {
      console.error('Failed to load local habit data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check Supabase session
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user.email);
      }
    };
    checkAuth();
  }, []);

  // Apply Theme to document root
  useEffect(() => {
    if (settings.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings.theme]);

  // Calculate Streaks Map
  const streakMap = useMemo(() => {
    const map = new Map<string, StreakInfo>();
    for (const habit of habits) {
      const streak = calculateHabitStreak(habit, logs, todayStr);
      map.set(habit.id, streak);
    }
    return map;
  }, [habits, logs, todayStr]);

  // Habit Actions
  const handleToggleComplete = async (habitId: string, currentStatus: boolean, value?: number, targetDate?: string) => {
    const dateToUse = targetDate || todayStr;
    const existingLog = logs.find(l => l.habit_id === habitId && l.date === dateToUse);
    const habit = habits.find(h => h.id === habitId);

    const updatedLog: HabitLog = {
      id: existingLog ? existingLog.id : `log-${habitId}-${dateToUse}`,
      habit_id: habitId,
      date: dateToUse,
      completed: currentStatus,
      value: value !== undefined ? value : (currentStatus ? (habit?.target_value || 1) : 0),
      updated_at: new Date().toISOString(),
    };

    await StorageEngine.saveLog(updatedLog);

    // Update in-memory state
    setLogs(prev => {
      const filtered = prev.filter(l => !(l.habit_id === habitId && l.date === dateToUse));
      return [...filtered, updatedLog];
    });

    // Cloud sync if authenticated
    const client = getSupabaseClient();
    if (client && isLoggedIn) {
      try {
        await client.from('habit_logs').upsert({
          id: updatedLog.id,
          habit_id: updatedLog.habit_id,
          date: updatedLog.date,
          completed: updatedLog.completed,
          value: updatedLog.value,
          updated_at: updatedLog.updated_at,
        });
      } catch (err) {
        console.warn('Cloud sync error for log:', err);
      }
    }
  };

  const handleUpdateValue = async (habitId: string, newValue: number, targetDate?: string) => {
    const dateToUse = targetDate || todayStr;
    const existingLog = logs.find(l => l.habit_id === habitId && l.date === dateToUse);
    const habit = habits.find(h => h.id === habitId);
    const target = habit?.target_value || 1;

    const isDone = newValue >= target;

    const updatedLog: HabitLog = {
      id: existingLog ? existingLog.id : `log-${habitId}-${dateToUse}`,
      habit_id: habitId,
      date: dateToUse,
      completed: isDone,
      value: newValue,
      updated_at: new Date().toISOString(),
    };

    await StorageEngine.saveLog(updatedLog);

    setLogs(prev => {
      const filtered = prev.filter(l => !(l.habit_id === habitId && l.date === dateToUse));
      return [...filtered, updatedLog];
    });

    const client = getSupabaseClient();
    if (client && isLoggedIn) {
      try {
        await client.from('habit_logs').upsert({
          id: updatedLog.id,
          habit_id: updatedLog.habit_id,
          date: updatedLog.date,
          completed: updatedLog.completed,
          value: updatedLog.value,
          updated_at: updatedLog.updated_at,
        });
      } catch (err) {
        console.warn('Cloud sync error:', err);
      }
    }
  };

  const handleSaveHabit = async (habitData: Partial<Habit>) => {
    const isEditing = Boolean(habitData.id);
    const newHabit: Habit = {
      id: habitData.id || `h-${Date.now()}`,
      title: habitData.title || 'Untitled Habit',
      description: habitData.description,
      category: habitData.category || 'dev',
      type: habitData.type || 'boolean',
      target_value: habitData.target_value || 1,
      unit: habitData.unit,
      frequency: habitData.frequency || 'daily',
      custom_days: habitData.custom_days,
      created_at: habitData.created_at || new Date().toISOString(),
      archived: habitData.archived || false,
      order_index: habitData.order_index ?? habits.length,
    };

    await StorageEngine.saveHabit(newHabit);
    playSound.complete(settings.sound_effects);

    setHabits(prev => {
      if (isEditing) {
        return prev.map(h => (h.id === newHabit.id ? newHabit : h));
      }
      return [...prev, newHabit];
    });

    const client = getSupabaseClient();
    if (client && isLoggedIn) {
      try {
        await client.from('habits').upsert(newHabit);
      } catch (e) {
        console.warn('Cloud sync error for habit:', e);
      }
    }
  };

  const handleArchiveHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const updated = { ...habit, archived: !habit.archived };
    await StorageEngine.saveHabit(updated);
    playSound.click(settings.sound_effects);
    setHabits(prev => prev.map(h => (h.id === habitId ? updated : h)));
  };

  const handleDeleteHabit = async (habitId: string) => {
    await StorageEngine.deleteHabit(habitId);
    playSound.undo(settings.sound_effects);
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setLogs(prev => prev.filter(l => l.habit_id !== habitId));
  };

  // Routine Actions
  const handleSaveRoutine = async (routine: Routine) => {
    await StorageEngine.saveRoutine(routine);
    playSound.complete(settings.sound_effects);
    setRoutines(prev => {
      const idx = prev.findIndex(r => r.id === routine.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = routine;
        return copy;
      }
      return [...prev, routine];
    });
  };

  const handleDeleteRoutine = async (routineId: string) => {
    await StorageEngine.deleteRoutine(routineId);
    playSound.undo(settings.sound_effects);
    setRoutines(prev => prev.filter(r => r.id !== routineId));
  };

  // Settings Actions
  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await StorageEngine.saveSettings(updated);
  };

  // Auth Handlers
  const handleAuthSuccess = (email: string) => {
    setIsLoggedIn(true);
    setUserEmail(email);
  };

  const handleSignOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setIsLoggedIn(false);
    setUserEmail(undefined);
    playSound.undo(settings.sound_effects);
  };

  // Keyboard Navigation & Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if inside input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Command Palette (Ctrl+K or Cmd+K or /)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }
      if (e.key === '/' && !isCommandPaletteOpen && !isHabitModalOpen) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // Shortcuts Modal (?)
      if (e.key === '?' && !isShortcutsOpen) {
        e.preventDefault();
        setIsShortcutsOpen(true);
        return;
      }

      // Quick Nav Tabs
      if (e.key === '0' || e.key === 'd' || e.key === 'D') {
        setActiveTab('dashboard');
        playSound.click(settings.sound_effects);
      } else if (e.key === '1' || e.key === 'r' || e.key === 'R') {
        setActiveTab('routines');
        playSound.click(settings.sound_effects);
      } else if (e.key === '2' || e.key === 'a' || e.key === 'A') {
        setActiveTab('analytics');
        playSound.click(settings.sound_effects);
      } else if (e.key === '3' || e.key === 'c' || e.key === 'C') {
        setActiveTab('calendar');
        playSound.click(settings.sound_effects);
      }

      // New Habit modal
      if ((e.key === 'n' || e.key === 'N') && !isHabitModalOpen) {
        e.preventDefault();
        setEditingHabit(null);
        setHabitPrefillTitle('');
        setIsHabitModalOpen(true);
      }

      // Settings modal
      if ((e.key === 's' || e.key === 'S') && !isSettingsOpen) {
        e.preventDefault();
        setIsSettingsOpen(true);
      }

      // Toggle Sound
      if (e.key === 'm' || e.key === 'M') {
        const next = !settings.sound_effects;
        if (next) playSound.click(true);
        handleUpdateSettings({ sound_effects: next });
      }

      // Toggle CRT
      if (e.key === 't' || e.key === 'T') {
        handleUpdateSettings({ crt_effects: !settings.crt_effects });
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    isCommandPaletteOpen,
    isShortcutsOpen,
    isHabitModalOpen,
    isSettingsOpen,
    settings.sound_effects,
    settings.crt_effects,
  ]);

  return (
    <div className="min-h-screen bg-term-bg text-term-text flex flex-col font-mono selection:bg-term-accent selection:text-black relative">
      {/* Optional CRT Scanlines Effect Overlay */}
      {settings.crt_effects && (
        <div className="fixed inset-0 crt-overlay z-50 pointer-events-none opacity-40" />
      )}

      {/* Top Terminal Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
      />

      {/* Layout Wrapper with Sidebar & Main Area */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          soundEnabled={settings.sound_effects}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 pb-20 min-w-0">
          {isLoading ? (
            <div className="py-24 text-center space-y-3 font-mono">
              <div className="inline-block w-6 h-6 border-2 border-term-accent border-t-transparent rounded-full animate-spin" />
              <div className="text-xs text-term-text-muted">
                $ loading system kernel &amp; indexeddb...
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  habits={habits}
                  logs={logs}
                  todayStr={todayStr}
                  settings={settings}
                  streakMap={streakMap}
                  onToggleComplete={handleToggleComplete}
                  onUpdateValue={handleUpdateValue}
                  onOpenNewHabit={(prefill) => {
                    setEditingHabit(null);
                    setHabitPrefillTitle(prefill || '');
                    setIsHabitModalOpen(true);
                  }}
                  onEditHabit={(h) => {
                    setEditingHabit(h);
                    setIsHabitModalOpen(true);
                  }}
                  onArchiveHabit={handleArchiveHabit}
                  onDeleteHabit={handleDeleteHabit}
                  onSetTheme={(theme: ThemeType) => handleUpdateSettings({ theme })}
                  onOpenRoutineTab={() => setActiveTab('routines')}
                />
              )}

              {activeTab === 'routines' && (
                <RoutinesView
                  routines={routines}
                  habits={habits}
                  logs={logs}
                  todayStr={todayStr}
                  settings={settings}
                  onSaveRoutine={handleSaveRoutine}
                  onDeleteRoutine={handleDeleteRoutine}
                  onToggleCompleteHabit={handleToggleComplete}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView
                  habits={habits}
                  logs={logs}
                  streakMap={streakMap}
                  todayStr={todayStr}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarView
                  habits={habits}
                  logs={logs}
                  todayStr={todayStr}
                  settings={settings}
                  onToggleCompleteHabit={handleToggleComplete}
                  onUpdateValueHabit={handleUpdateValue}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Minimalist Terminal Footer Bar */}
      <footer className="border-t border-term-border bg-black py-2 px-3 sm:px-6 text-[11px] font-mono text-term-text-dim">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span>[ ] enter: keyboard control</span>
            <span>·</span>
            <button onClick={() => { setEditingHabit(null); setHabitPrefillTitle(''); setIsHabitModalOpen(true); }} className="hover:text-term-accent">
              [n] new habit
            </button>
            <span>·</span>
            <button onClick={() => setActiveTab('routines')} className="hover:text-term-accent">
              [r] routines
            </button>
            <span>·</span>
            <span>[0-3] views</span>
            <span>·</span>
            <button onClick={() => setIsShortcutsOpen(true)} className="hover:text-term-accent">
              [?] help
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hover:text-term-accent transition-colors"
            >
              [⌘K] commands
            </button>
            <span>·</span>
            <span className="text-term-accent text-[10px]">
              // local-first ready
            </span>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => {
          setIsHabitModalOpen(false);
          setEditingHabit(null);
          setHabitPrefillTitle('');
        }}
        onSave={handleSaveHabit}
        editingHabit={editingHabit}
        initialTitle={habitPrefillTitle}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        habits={habits}
        logs={logs}
        routines={routines}
        onReloadAllData={loadData}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        onAuthSuccess={handleAuthSuccess}
        onSignOut={handleSignOut}
        onOpenSettings={() => setIsSettingsOpen(true)}
        soundEnabled={settings.sound_effects}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={setActiveTab}
        onOpenNewHabit={() => {
          setEditingHabit(null);
          setHabitPrefillTitle('');
          setIsHabitModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSound={() => handleUpdateSettings({ sound_effects: !settings.sound_effects })}
        onToggleCRT={() => handleUpdateSettings({ crt_effects: !settings.crt_effects })}
        onSetTheme={(theme) => handleUpdateSettings({ theme })}
        onExportJSON={async () => {
          const data = await StorageEngine.exportFullData();
          const jsonStr = JSON.stringify(data, null, 2);
          const { downloadFile } = await import('./lib/exportImport');
          downloadFile(jsonStr, `kairos-backup-${todayStr}.json`, 'application/json');
        }}
        onExportCSV={async () => {
          const { exportToCSV } = await import('./lib/exportImport');
          exportToCSV(habits, logs);
        }}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

export default App;

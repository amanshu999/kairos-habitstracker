import React, { useState, useEffect } from 'react';
import { 
  Menu,
  Sprout,
  Check, 
  Workflow, 
  BarChart2, 
  Calendar as CalendarIcon, 
  Settings as SettingsIcon, 
  HelpCircle, 
  Sun,
  Volume2,
  VolumeX,
  ChevronDown,
  Command,
  Cloud,
  CloudOff
} from 'lucide-react';
import { ThemeType, UserSettings, SyncState } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { playSound } from '../lib/audio';

interface NavbarProps {
  activeTab: 'dashboard' | 'routines' | 'analytics' | 'calendar';
  setActiveTab: (tab: 'dashboard' | 'routines' | 'analytics' | 'calendar') => void;
  onToggleSidebar: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenShortcuts: () => void;
  onOpenCommandPalette: () => void;
  isLoggedIn: boolean;
  userEmail?: string;
  syncState?: SyncState;
  pendingSyncCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onToggleSidebar,
  settings,
  onUpdateSettings,
  onOpenSettings,
  onOpenAuth,
  onOpenShortcuts,
  onOpenCommandPalette,
  isLoggedIn,
  userEmail,
  syncState = 'idle',
  pendingSyncCount = 0,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const themes: { id: ThemeType; label: string; dotColor: string }[] = [
    { id: 'terminal-emerald', label: 'Emerald', dotColor: '#22c55e' },
    { id: 'matrix-green', label: 'Matrix', dotColor: '#00ff66' },
    { id: 'dracula', label: 'Dracula', dotColor: '#bd93f9' },
    { id: 'nord', label: 'Nord', dotColor: '#88c0d0' },
    { id: 'amber-crt', label: 'Amber', dotColor: '#ffb000' },
  ];

  const handleTabClick = (tab: 'dashboard' | 'routines' | 'analytics' | 'calendar') => {
    playSound.click(settings.sound_effects);
    setActiveTab(tab);
  };

  const hasCloud = isSupabaseConfigured();
  const currentTheme = themes.find(t => t.id === settings.theme) || themes[0];

  return (
    <header className="border-b border-term-border bg-term-bg/95 backdrop-blur sticky top-0 z-40 px-3 sm:px-6 py-2.5 font-mono select-none">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-3 text-xs">
        
        {/* Left: 3-Lines Hamburger Menu + Brand (Sprout icon + kairos + beta) */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* 3 lines button */}
          <button
            onClick={() => {
              playSound.click(settings.sound_effects);
              onToggleSidebar();
            }}
            className="p-1.5 rounded-lg border border-term-border bg-term-surface hover:bg-term-elevated text-term-text-muted hover:text-term-accent transition-colors"
            title="Toggle Menu (3 lines)"
          >
            <Menu size={16} />
          </button>

          {/* Logo */}
          <div 
            onClick={() => handleTabClick('dashboard')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="text-term-accent transition-transform group-hover:scale-110">
              <Sprout size={20} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base tracking-tight text-term-text">
              kairos
            </span>
            <span className="text-[10px] text-term-accent font-medium px-2 py-0.5 rounded-full border border-term-accent/30 bg-term-accent/10">
              beta
            </span>
          </div>
        </div>

        {/* Center Pill Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-full bg-term-surface border border-term-border">
          <button
            onClick={() => handleTabClick('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all text-xs font-medium ${
              activeTab === 'dashboard'
                ? 'bg-term-elevated text-term-accent font-semibold border border-term-border-strong shadow-sm'
                : 'text-term-text-muted hover:text-term-text'
            }`}
          >
            <Check size={13} strokeWidth={3} className={activeTab === 'dashboard' ? 'text-term-accent' : 'opacity-0'} />
            <span>Habits</span>
          </button>

          <button
            onClick={() => handleTabClick('routines')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all text-xs font-medium ${
              activeTab === 'routines'
                ? 'bg-term-elevated text-term-accent font-semibold border border-term-border-strong shadow-sm'
                : 'text-term-text-muted hover:text-term-text'
            }`}
          >
            <Workflow size={13} />
            <span>Routines</span>
          </button>

          <button
            onClick={() => handleTabClick('analytics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all text-xs font-medium ${
              activeTab === 'analytics'
                ? 'bg-term-elevated text-term-accent font-semibold border border-term-border-strong shadow-sm'
                : 'text-term-text-muted hover:text-term-text'
            }`}
          >
            <BarChart2 size={13} />
            <span>Stats</span>
          </button>

          <button
            onClick={() => handleTabClick('calendar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all text-xs font-medium ${
              activeTab === 'calendar'
                ? 'bg-term-elevated text-term-accent font-semibold border border-term-border-strong shadow-sm'
                : 'text-term-text-muted hover:text-term-text'
            }`}
          >
            <CalendarIcon size={13} />
            <span>Calendar</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-term-text-muted hover:text-term-text transition-colors"
          >
            <SettingsIcon size={13} />
            <span>System</span>
          </button>

          <button
            onClick={onOpenShortcuts}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-term-text-muted hover:text-term-text transition-colors"
          >
            <HelpCircle size={13} />
            <span>Help</span>
          </button>
        </nav>

        {/* Right Tools: Time, Sound Toggle, Sun/Theme, Emerald Dropdown, Cloud */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Clock */}
          <span className="text-term-text-muted text-xs font-mono font-medium hidden sm:inline">
            {timeStr}
          </span>

          {/* Sound Enable/Disable Toggle Button */}
          <button
            onClick={() => {
              const next = !settings.sound_effects;
              if (next) playSound.click(true);
              onUpdateSettings({ sound_effects: next });
            }}
            className={`p-1.5 rounded-full border transition-colors ${
              settings.sound_effects
                ? 'border-term-accent/40 bg-term-accent/10 text-term-accent'
                : 'border-term-border bg-term-surface text-term-text-dim hover:text-term-text'
            }`}
            title={`Sound FX: ${settings.sound_effects ? 'ENABLED' : 'MUTED'} (Click to toggle)`}
          >
            {settings.sound_effects ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Sun / Theme icon */}
          <button
            onClick={() => {
              const nextIndex = (themes.findIndex(t => t.id === settings.theme) + 1) % themes.length;
              onUpdateSettings({ theme: themes[nextIndex].id });
              playSound.click(settings.sound_effects);
            }}
            className="p-1 rounded-full text-term-text-muted hover:text-term-accent transition-colors"
            title="Cycle theme"
          >
            <Sun size={15} />
          </button>

          {/* Theme Dropdown Pill */}
          <div className="relative group">
            <button 
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-term-surface border border-term-border hover:border-term-border-strong text-term-text font-medium"
            >
              <span 
                className="w-2 h-2 rounded-full inline-block" 
                style={{ backgroundColor: currentTheme.dotColor }} 
              />
              <span className="hidden sm:inline">{currentTheme.label}</span>
              <ChevronDown size={12} className="text-term-text-dim" />
            </button>
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex flex-col bg-term-surface border border-term-border-strong rounded-xl py-1 w-36 z-50 shadow-2xl animate-slide-down">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    playSound.click(settings.sound_effects);
                    onUpdateSettings({ theme: t.id });
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-term-elevated transition-colors ${
                    settings.theme === t.id ? 'text-term-accent font-semibold' : 'text-term-text-muted'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.dotColor }} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cloud Auth Status Pill */}
          <button
            onClick={onOpenAuth}
            className={`hidden md:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
              syncState === 'syncing'
                ? 'border-term-cyan/60 text-term-cyan bg-term-cyan/10 animate-pulse'
                : (pendingSyncCount && pendingSyncCount > 0)
                ? 'border-term-amber/60 text-term-amber bg-term-amber/10'
                : isLoggedIn
                ? 'border-term-accent/50 text-term-accent bg-term-accent/10 font-semibold'
                : hasCloud
                ? 'border-term-cyan/40 text-term-cyan bg-term-cyan/5'
                : 'border-term-border text-term-text-dim hover:text-term-text'
            }`}
          >
            {isLoggedIn ? <Cloud size={12} className={syncState === 'syncing' ? 'animate-spin' : ''} /> : <CloudOff size={12} />}
            <span>
              {syncState === 'syncing'
                ? 'Syncing...'
                : (pendingSyncCount && pendingSyncCount > 0)
                ? `${pendingSyncCount} Queued`
                : isLoggedIn
                ? 'Synced'
                : 'Local'}
            </span>
          </button>

          {/* Command Palette */}
          <button
            onClick={onOpenCommandPalette}
            className="p-1.5 rounded-lg border border-term-border bg-term-surface hover:bg-term-elevated text-term-text-muted hover:text-term-accent"
            title="Command Palette (⌘K or /)"
          >
            <Command size={13} />
          </button>
        </div>
      </div>
    </header>
  );
};

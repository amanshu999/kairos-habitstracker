import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Volume2, 
  VolumeX, 
  Tv, 
  HelpCircle, 
  Command, 
  Cloud, 
  CloudOff, 
  Settings as SettingsIcon,
  CheckSquare,
  ListOrdered,
  BarChart2,
  Calendar as CalendarIcon
} from 'lucide-react';
import { ThemeType, UserSettings } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { playSound } from '../lib/audio';

interface NavbarProps {
  activeTab: 'dashboard' | 'routines' | 'analytics' | 'calendar';
  setActiveTab: (tab: 'dashboard' | 'routines' | 'analytics' | 'calendar') => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenShortcuts: () => void;
  onOpenCommandPalette: () => void;
  isLoggedIn: boolean;
  userEmail?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  onUpdateSettings,
  onOpenSettings,
  onOpenAuth,
  onOpenShortcuts,
  onOpenCommandPalette,
  isLoggedIn,
  userEmail,
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
    { id: 'terminal-emerald', label: 'Emerald', dotColor: '#10b981' },
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

  return (
    <header className="border-b border-term-border bg-term-surface/95 backdrop-blur sticky top-0 z-40 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Live Clock */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div 
            onClick={() => handleTabClick('dashboard')} 
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 rounded bg-term-elevated border border-term-border flex items-center justify-center text-term-accent group-hover:border-term-accent transition-colors">
              <Terminal size={18} />
            </div>
            <div>
              <span className="font-bold tracking-tight text-term-text text-sm sm:text-base flex items-center">
                init.<span className="text-term-accent">habits</span>
                <span className="inline-block w-2 h-4 bg-term-accent ml-1 animate-cursor-blink" />
              </span>
              <span className="text-[10px] text-term-text-dim block -mt-1 font-mono">
                v1.2.0-prod // terminal-ui
              </span>
            </div>
          </div>

          {/* Time & Quick hotkey trigger on mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-xs font-mono text-term-text-muted bg-term-elevated px-2 py-1 rounded border border-term-border">
              {timeStr}
            </span>
            <button
              onClick={onOpenCommandPalette}
              className="p-1.5 rounded bg-term-elevated border border-term-border text-term-text-muted hover:text-term-accent"
              title="Command Palette"
            >
              <Command size={15} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => handleTabClick('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-all ${
              activeTab === 'dashboard'
                ? 'bg-term-elevated border-term-accent text-term-accent font-semibold'
                : 'border-transparent text-term-text-muted hover:text-term-text hover:bg-term-elevated/50'
            }`}
          >
            <CheckSquare size={13} />
            <span>[0] Habits</span>
          </button>

          <button
            onClick={() => handleTabClick('routines')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-all ${
              activeTab === 'routines'
                ? 'bg-term-elevated border-term-accent text-term-accent font-semibold'
                : 'border-transparent text-term-text-muted hover:text-term-text hover:bg-term-elevated/50'
            }`}
          >
            <ListOrdered size={13} />
            <span>[1] Routines</span>
          </button>

          <button
            onClick={() => handleTabClick('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-all ${
              activeTab === 'analytics'
                ? 'bg-term-elevated border-term-accent text-term-accent font-semibold'
                : 'border-transparent text-term-text-muted hover:text-term-text hover:bg-term-elevated/50'
            }`}
          >
            <BarChart2 size={13} />
            <span>[2] Analytics</span>
          </button>

          <button
            onClick={() => handleTabClick('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-all ${
              activeTab === 'calendar'
                ? 'bg-term-elevated border-term-accent text-term-accent font-semibold'
                : 'border-transparent text-term-text-muted hover:text-term-text hover:bg-term-elevated/50'
            }`}
          >
            <CalendarIcon size={13} />
            <span>[3] Calendar</span>
          </button>
        </nav>

        {/* Right Tools & Preferences */}
        <div className="hidden md:flex items-center gap-2">
          {/* Live Clock */}
          <div className="text-xs font-mono text-term-text-muted bg-term-elevated px-2.5 py-1 rounded border border-term-border">
            {timeStr}
          </div>

          {/* Theme Quick Selector */}
          <div className="relative group">
            <button 
              className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded bg-term-elevated border border-term-border hover:border-term-border-strong text-term-text-muted hover:text-term-text"
              title="Change Terminal Theme"
            >
              <span 
                className="w-2.5 h-2.5 rounded-full inline-block" 
                style={{ backgroundColor: themes.find(t => t.id === settings.theme)?.dotColor || '#10b981' }} 
              />
              <span className="capitalize">{settings.theme.replace('terminal-', '').replace('-crt', '')}</span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex flex-col bg-term-surface border border-term-border-strong rounded shadow-xl py-1 w-36 z-50 animate-slide-down">
              <div className="px-2.5 py-1 text-[10px] text-term-text-dim border-b border-term-border font-mono">
                SELECT PALETTE
              </div>
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    playSound.click(settings.sound_effects);
                    onUpdateSettings({ theme: t.id });
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 text-xs text-left hover:bg-term-elevated ${
                    settings.theme === t.id ? 'text-term-accent font-semibold' : 'text-term-text-muted'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.dotColor }} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Toggle */}
          <button
            onClick={() => {
              const next = !settings.sound_effects;
              if (next) playSound.click(true);
              onUpdateSettings({ sound_effects: next });
            }}
            className={`p-1.5 rounded border text-xs font-mono transition-colors ${
              settings.sound_effects 
                ? 'bg-term-elevated border-term-border text-term-accent' 
                : 'bg-term-elevated/40 border-term-border text-term-text-dim hover:text-term-text-muted'
            }`}
            title={`Sound FX: ${settings.sound_effects ? 'ON' : 'OFF'}`}
          >
            {settings.sound_effects ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* CRT Scanlines Toggle */}
          <button
            onClick={() => {
              playSound.click(settings.sound_effects);
              onUpdateSettings({ crt_effects: !settings.crt_effects });
            }}
            className={`p-1.5 rounded border text-xs font-mono transition-colors ${
              settings.crt_effects 
                ? 'bg-term-elevated border-term-border text-term-accent glow-accent' 
                : 'bg-term-elevated/40 border-term-border text-term-text-dim hover:text-term-text-muted'
            }`}
            title={`CRT Scanlines: ${settings.crt_effects ? 'ON' : 'OFF'}`}
          >
            <Tv size={14} />
          </button>

          {/* Cloud Auth / Sync Status */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded border transition-colors ${
              isLoggedIn
                ? 'bg-term-accent-dim border-term-accent text-term-accent font-medium'
                : hasCloud
                ? 'bg-term-elevated border-term-border text-term-cyan hover:border-term-cyan'
                : 'bg-term-elevated border-term-border text-term-text-dim hover:text-term-text-muted'
            }`}
            title={isLoggedIn ? `Logged in as ${userEmail}` : hasCloud ? 'Cloud connected (Click to log in)' : 'Local Storage Mode'}
          >
            {isLoggedIn ? <Cloud size={13} /> : <CloudOff size={13} />}
            <span className="hidden lg:inline text-[11px]">
              {isLoggedIn ? 'CLOUD_SYNC' : hasCloud ? 'SIGN_IN' : 'LOCAL_FIRST'}
            </span>
          </button>

          {/* Command Palette Button */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1 px-2 py-1 rounded bg-term-elevated border border-term-border text-term-text-muted hover:text-term-accent hover:border-term-accent transition-colors text-xs font-mono"
            title="Command Palette (Ctrl+K or /)"
          >
            <Command size={13} />
            <span className="text-[10px] bg-term-surface px-1 py-0.5 rounded border border-term-border">⌘K</span>
          </button>

          {/* Help Shortcuts */}
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded bg-term-elevated border border-term-border text-term-text-muted hover:text-term-accent hover:border-term-accent transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle size={14} />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded bg-term-elevated border border-term-border text-term-text-muted hover:text-term-accent hover:border-term-accent transition-colors"
            title="Settings & Export"
          >
            <SettingsIcon size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};

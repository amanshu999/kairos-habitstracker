import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Tv, 
  HelpCircle, 
  Command, 
  Cloud, 
  CloudOff, 
  Settings as SettingsIcon 
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
    { id: 'terminal-emerald', label: 'Terminal', dotColor: '#22c55e' },
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
    <header className="border-b border-term-border bg-black/90 backdrop-blur sticky top-0 z-40 px-3 sm:px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Brand and Navigation */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* Logo */}
          <div 
            onClick={() => handleTabClick('dashboard')}
            className="flex items-center gap-1.5 cursor-pointer select-none text-term-text font-bold"
          >
            <span className="text-term-accent font-bold">[h]</span>
            <span>init.<span className="text-term-accent">Habits</span></span>
            <span className="text-[10px] text-term-text-dim px-1 py-0.2 rounded border border-term-border ml-1">
              [beta]
            </span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-2 sm:gap-3 text-term-text-dim overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`hover:text-term-text transition-colors ${
                activeTab === 'dashboard' ? 'text-term-accent font-bold' : ''
              }`}
            >
              habits
            </button>
            <span>·</span>
            <button
              onClick={() => handleTabClick('routines')}
              className={`hover:text-term-text transition-colors ${
                activeTab === 'routines' ? 'text-term-accent font-bold' : ''
              }`}
            >
              routines
            </button>
            <span>·</span>
            <button
              onClick={() => handleTabClick('analytics')}
              className={`hover:text-term-text transition-colors ${
                activeTab === 'analytics' ? 'text-term-accent font-bold' : ''
              }`}
            >
              stats
            </button>
            <span>·</span>
            <button
              onClick={() => handleTabClick('calendar')}
              className={`hover:text-term-text transition-colors ${
                activeTab === 'calendar' ? 'text-term-accent font-bold' : ''
              }`}
            >
              calendar
            </button>
            <span>·</span>
            <button
              onClick={onOpenSettings}
              className="hover:text-term-text transition-colors"
            >
              system
            </button>
            <span>·</span>
            <button
              onClick={onOpenShortcuts}
              className="hover:text-term-text transition-colors"
            >
              help
            </button>
          </nav>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Clock */}
          <span className="text-term-text-dim text-[11px] hidden sm:inline">
            {timeStr}
          </span>

          {/* Theme dropdown */}
          <div className="relative group">
            <button 
              className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border border-term-border text-term-text-dim hover:text-term-text hover:border-term-border-strong"
              title="Theme"
            >
              <span 
                className="w-2 h-2 rounded-full inline-block" 
                style={{ backgroundColor: themes.find(t => t.id === settings.theme)?.dotColor || '#22c55e' }} 
              />
              <span className="capitalize">{settings.theme.replace('terminal-', '').replace('-crt', '').replace('-green', '')}</span>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-black border border-term-border-strong rounded py-1 w-32 z-50 animate-slide-down">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    playSound.click(settings.sound_effects);
                    onUpdateSettings({ theme: t.id });
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1 text-[11px] text-left hover:bg-term-elevated ${
                    settings.theme === t.id ? 'text-term-accent font-semibold' : 'text-term-text-muted'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.dotColor }} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sound */}
          <button
            onClick={() => {
              const next = !settings.sound_effects;
              if (next) playSound.click(true);
              onUpdateSettings({ sound_effects: next });
            }}
            className="p-1 rounded text-term-text-dim hover:text-term-accent"
            title={`Audio FX: ${settings.sound_effects ? 'ON' : 'MUTED'}`}
          >
            {settings.sound_effects ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>

          {/* CRT */}
          <button
            onClick={() => onUpdateSettings({ crt_effects: !settings.crt_effects })}
            className={`p-1 rounded ${settings.crt_effects ? 'text-term-accent' : 'text-term-text-dim hover:text-term-text'}`}
            title="CRT Scanlines"
          >
            <Tv size={13} />
          </button>

          {/* Cloud Auth */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
              isLoggedIn
                ? 'border-term-accent text-term-accent bg-term-accent/10'
                : hasCloud
                ? 'border-term-cyan/60 text-term-cyan'
                : 'border-term-border text-term-text-dim'
            }`}
            title={isLoggedIn ? `Logged in: ${userEmail}` : 'Cloud Auth'}
          >
            {isLoggedIn ? <Cloud size={11} /> : <CloudOff size={11} />}
            <span className="hidden md:inline">{isLoggedIn ? 'SYNCED' : 'LOCAL'}</span>
          </button>

          {/* Command Palette */}
          <button
            onClick={onOpenCommandPalette}
            className="p-1 rounded text-term-text-dim hover:text-term-text"
            title="Command Palette (⌘K or /)"
          >
            <Command size={13} />
          </button>
        </div>
      </div>
    </header>
  );
};

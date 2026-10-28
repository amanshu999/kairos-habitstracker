import React, { useState, useEffect, useRef } from 'react';
import { 
  Command, 
  Search, 
  CheckSquare, 
  ListOrdered, 
  BarChart2, 
  Calendar, 
  Plus, 
  Volume2, 
  Tv, 
  Download, 
  Settings, 
  Palette,
  ArrowRight
} from 'lucide-react';
import { ThemeType } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: 'dashboard' | 'routines' | 'analytics' | 'calendar') => void;
  onOpenNewHabit: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onToggleCRT: () => void;
  onSetTheme: (theme: ThemeType) => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenNewHabit,
  onOpenSettings,
  onToggleSound,
  onToggleCRT,
  onSetTheme,
  onExportJSON,
  onExportCSV,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands = [
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      label: 'Go to Habits Dashboard',
      shortcut: '0 or D',
      icon: <CheckSquare size={14} />,
      action: () => onSelectTab('dashboard'),
    },
    {
      id: 'nav-routines',
      category: 'Navigation',
      label: 'Go to Routines Manager',
      shortcut: '1 or R',
      icon: <ListOrdered size={14} />,
      action: () => onSelectTab('routines'),
    },
    {
      id: 'nav-analytics',
      category: 'Navigation',
      label: 'Go to Analytics & Metrics',
      shortcut: '2 or A',
      icon: <BarChart2 size={14} />,
      action: () => onSelectTab('analytics'),
    },
    {
      id: 'nav-calendar',
      category: 'Navigation',
      label: 'Go to Calendar Audit',
      shortcut: '3 or C',
      icon: <Calendar size={14} />,
      action: () => onSelectTab('calendar'),
    },
    {
      id: 'act-new-habit',
      category: 'Actions',
      label: 'Create New Habit',
      shortcut: 'N',
      icon: <Plus size={14} className="text-term-accent" />,
      action: () => onOpenNewHabit(),
    },
    {
      id: 'act-settings',
      category: 'Actions',
      label: 'Open Settings & Preferences',
      shortcut: 'S',
      icon: <Settings size={14} />,
      action: () => onOpenSettings(),
    },
    {
      id: 'act-sound',
      category: 'Preferences',
      label: 'Toggle 8-Bit Audio Synthesizer',
      shortcut: 'M',
      icon: <Volume2 size={14} />,
      action: () => onToggleSound(),
    },
    {
      id: 'act-crt',
      category: 'Preferences',
      label: 'Toggle CRT Scanlines Monitor Effect',
      shortcut: 'T',
      icon: <Tv size={14} />,
      action: () => onToggleCRT(),
    },
    {
      id: 'theme-emerald',
      category: 'Themes',
      label: 'Switch Theme: Terminal Emerald',
      icon: <Palette size={14} className="text-emerald-400" />,
      action: () => onSetTheme('terminal-emerald'),
    },
    {
      id: 'theme-matrix',
      category: 'Themes',
      label: 'Switch Theme: Phosphor Matrix',
      icon: <Palette size={14} className="text-green-400" />,
      action: () => onSetTheme('matrix-green'),
    },
    {
      id: 'theme-dracula',
      category: 'Themes',
      label: 'Switch Theme: Dracula Midnight',
      icon: <Palette size={14} className="text-purple-400" />,
      action: () => onSetTheme('dracula'),
    },
    {
      id: 'theme-nord',
      category: 'Themes',
      label: 'Switch Theme: Nord Polar',
      icon: <Palette size={14} className="text-sky-400" />,
      action: () => onSetTheme('nord'),
    },
    {
      id: 'theme-amber',
      category: 'Themes',
      label: 'Switch Theme: Amber CRT Vintage',
      icon: <Palette size={14} className="text-amber-400" />,
      action: () => onSetTheme('amber-crt'),
    },
    {
      id: 'data-json',
      category: 'Data',
      label: 'Export Complete JSON Backup',
      icon: <Download size={14} />,
      action: () => onExportJSON(),
    },
    {
      id: 'data-csv',
      category: 'Data',
      label: 'Export Habit Records to CSV',
      icon: <Download size={14} />,
      action: () => onExportCSV(),
    },
  ];

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const executeSelected = (index: number) => {
    if (filtered[index]) {
      filtered[index].action();
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeSelected(selectedIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="terminal-card bg-term-surface border border-term-accent/60 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-term-border bg-term-elevated">
          <Search size={16} className="text-term-accent" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or filter (e.g. 'routine', 'theme', 'export')..."
            className="flex-1 bg-transparent text-term-text font-mono text-xs sm:text-sm focus:outline-none placeholder:text-term-text-dim"
          />
          <span className="text-[10px] text-term-text-dim bg-term-surface px-1.5 py-0.5 rounded border border-term-border">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-term-border/40 text-xs">
          {filtered.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={item.id}
                onClick={() => executeSelected(idx)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`p-2.5 rounded cursor-pointer flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-term-elevated border border-term-accent/40 text-term-accent'
                    : 'text-term-text hover:bg-term-elevated/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1 rounded ${isSelected ? 'text-term-accent' : 'text-term-text-dim'}`}>
                    {item.icon}
                  </div>
                  <div>
                    <span className="font-semibold block">{item.label}</span>
                    <span className="text-[10px] text-term-text-dim">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.shortcut && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-term-surface border border-term-border text-term-text-muted">
                      {item.shortcut}
                    </span>
                  )}
                  {isSelected && <ArrowRight size={13} className="text-term-accent" />}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-term-text-dim text-xs">
              No matching terminal commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

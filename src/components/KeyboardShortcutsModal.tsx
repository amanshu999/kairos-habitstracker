import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Navigation & Views',
      shortcuts: [
        { key: '0  /  D', label: 'Habits Dashboard' },
        { key: '1  /  R', label: 'Routines Manager' },
        { key: '2  /  A', label: 'Analytics & Heatmaps' },
        { key: '3  /  C', label: 'Calendar Audit' },
      ],
    },
    {
      title: 'Habit Actions',
      shortcuts: [
        { key: 'N', label: 'Quick Add New Habit' },
        { key: 'Ctrl+K  /  /', label: 'Open Command Palette' },
        { key: 'Ctrl+Enter', label: 'Save / Commit Habit Modal' },
        { key: 'Esc', label: 'Close Modals / Overlays' },
      ],
    },
    {
      title: 'System & Tools',
      shortcuts: [
        { key: '?', label: 'Open this Cheat Sheet' },
        { key: 'S', label: 'Open Settings' },
        { key: 'M', label: 'Toggle Synthesizer Audio' },
        { key: 'T', label: 'Toggle CRT Scanlines' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="terminal-card bg-term-surface border border-term-border-strong rounded-lg max-w-md w-full p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-term-border mb-4">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-term-accent" />
            <h2 className="text-sm font-bold text-term-text">
              $ man init.habits --keybindings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-term-text-muted hover:text-term-text"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {shortcutGroups.map(group => (
            <div key={group.title} className="space-y-1.5">
              <h3 className="text-term-accent font-bold text-[11px] uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="p-2 rounded bg-term-elevated border border-term-border divide-y divide-term-border/40">
                {group.shortcuts.map(s => (
                  <div key={s.key} className="py-1.5 flex items-center justify-between">
                    <span className="text-term-text-muted">{s.label}</span>
                    <kbd className="px-2 py-0.5 rounded bg-term-surface border border-term-border font-bold text-term-text font-mono text-[11px]">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-term-border text-center text-[11px] text-term-text-dim">
          Press <kbd className="px-1.5 py-0.5 rounded bg-term-elevated border border-term-border text-term-text">Esc</kbd> or click outside to dismiss.
        </div>
      </div>
    </div>
  );
};

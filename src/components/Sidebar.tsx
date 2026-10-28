import React from 'react';
import { 
  Home, 
  CheckCircle2, 
  Workflow, 
  Calendar as CalendarIcon, 
  BarChart2, 
  Settings as SettingsIcon, 
  HelpCircle,
  Sprout
} from 'lucide-react';
import { playSound } from '../lib/audio';

interface SidebarProps {
  activeTab: 'dashboard' | 'routines' | 'analytics' | 'calendar';
  setActiveTab: (tab: 'dashboard' | 'routines' | 'analytics' | 'calendar') => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  soundEnabled: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenShortcuts,
  soundEnabled,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={16} />, isTab: true },
    { id: 'habits', label: 'Habits', icon: <CheckCircle2 size={16} />, isTab: true, tabTarget: 'dashboard' as const },
    { id: 'routines', label: 'Routines', icon: <Workflow size={16} />, isTab: true, tabTarget: 'routines' as const },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={16} />, isTab: true, tabTarget: 'calendar' as const },
    { id: 'analytics', label: 'Stats', icon: <BarChart2 size={16} />, isTab: true, tabTarget: 'analytics' as const },
    { id: 'system', label: 'System', icon: <SettingsIcon size={16} />, isTab: false, action: onOpenSettings },
    { id: 'help', label: 'Help', icon: <HelpCircle size={16} />, isTab: false, action: onOpenShortcuts },
  ];

  return (
    <aside className="w-52 shrink-0 hidden md:flex flex-col justify-between p-3 min-h-[calc(100vh-65px)] border-r border-term-border bg-term-surface/40 font-mono text-xs select-none">
      {/* Navigation Links */}
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = 
            (item.id === 'dashboard' && activeTab === 'dashboard') ||
            (item.id === 'habits' && activeTab === 'dashboard') ||
            (item.id === 'routines' && activeTab === 'routines') ||
            (item.id === 'calendar' && activeTab === 'calendar') ||
            (item.id === 'analytics' && activeTab === 'analytics');

          return (
            <button
              key={item.id}
              onClick={() => {
                playSound.click(soundEnabled);
                if (item.isTab && item.tabTarget) {
                  setActiveTab(item.tabTarget);
                } else if (item.isTab) {
                  setActiveTab(item.id as any);
                } else if (item.action) {
                  item.action();
                }
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-term-elevated text-term-accent font-semibold border border-term-border-strong shadow-sm'
                  : 'text-term-text-muted hover:text-term-text hover:bg-term-elevated/40'
              }`}
            >
              <span className={isActive ? 'text-term-accent' : 'text-term-text-dim'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quote Card */}
      <div className="p-3.5 rounded-xl bg-term-surface border border-term-border text-term-text-muted space-y-1">
        <div className="text-xl font-serif text-term-accent leading-none">
          &ldquo;
        </div>
        <p className="text-[11px] italic text-term-text leading-relaxed">
          Small habits build a better you.
        </p>
        <div className="flex justify-end pt-1">
          <Sprout size={14} className="text-term-accent opacity-80" />
        </div>
      </div>
    </aside>
  );
};
